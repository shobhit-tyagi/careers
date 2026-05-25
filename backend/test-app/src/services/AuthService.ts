import { dataSource } from '../plugins/db';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { config } from '../config';
import { TokenPair } from '../types';
import {
    ConflictError,
    AppError,
    UnauthorizedError,
} from '../types/errors';
import type { StringValue } from 'ms';
import { ApiResponse } from '../types/api';

const MAX_FAILED = config.auth.maxFailedLoginAttempts ?? 3;
const LOCK_MINUTES = config.auth.lockDurationMinutes ?? 15;

export class AuthService {
    private userRepository = dataSource.getRepository(User);
    private refreshTokenRepository =
        dataSource.getRepository(RefreshToken);

    async register(
        email: string,
        password: string,
        displayName: string,
    ): Promise<
        ApiResponse<{
            userId: string;
            accessToken: string;
            refreshToken: string;
        }>
    > {
        const existing = await this.userRepository.findOne({
            where: { email },
        });

        if (existing) {
            throw new ConflictError(
                `User with email ${email} already exists`,
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = this.userRepository.create({
            email,
            passwordHash,
            displayName,
        });

        const savedUser = await this.userRepository.save(user);

        const tokens =
            await this.generateAndStoreTokens(savedUser);

        return {
            data: {
                userId: savedUser.id,
                ...tokens,
            },
        };
    }

    async login(email: string, password: string) {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            throw new AppError(
                401,
                'Invalid credentials',
                'INVALID_CREDENTIALS',
            );
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new AppError(
                423,
                'Account is locked',
                'ACCOUNT_LOCKED',
            );
        }

        const match = await bcrypt.compare(
            password,
            user.passwordHash,
        );

        if (!match) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= MAX_FAILED) {
                user.lockedUntil = new Date(
                    Date.now() + LOCK_MINUTES * 60 * 1000,
                );

                user.failedLoginAttempts = 0;
                await this.refreshTokenRepository.update(
                    { user: { id: user.id }, revoked: false },
                    { revoked: true },
                );
            }

            await this.userRepository.save(user);
            throw new AppError(
                401,
                'Invalid credentials',
                'INVALID_CREDENTIALS',
            );
        }

        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        await this.userRepository.save(user);

        const tokens = await this.generateAndStoreTokens(user);

        return {
            data: {
                userId: user.id,
                ...tokens,
            },
        };
    }

    async refresh(refreshToken: string) {
        const refreshSecret: Secret =
            config.jwt.refreshSecret as Secret;

        let decoded: JwtPayload;
        try {
            decoded = jwt.verify(refreshToken, refreshSecret) as JwtPayload;
        } catch {
            throw new UnauthorizedError('Invalid refresh token');
        }

        if (!decoded.userId || typeof decoded.userId !== 'string') {
            throw new UnauthorizedError('Invalid refresh token');
        }

        const hashedToken = this.hashToken(refreshToken);
        const storedToken = await this.refreshTokenRepository.findOne({
            where: {
                tokenHash: hashedToken,
                revoked: false,
            },
            relations: ['user'],
        });

        if (!storedToken) {
            throw new UnauthorizedError('Refresh token revoked');
        }

        if (storedToken.expiresAt < new Date()) {
            throw new UnauthorizedError('Refresh token expired');
        }

        const user = storedToken.user;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new UnauthorizedError('Account locked');
        }

        storedToken.revoked = true;
        await this.refreshTokenRepository.save(storedToken);

        const tokens = await this.generateAndStoreTokens(user);
        return { data: tokens };
    }

    async logout(refreshToken: string): Promise<void> {
        const hashedToken = this.hashToken(refreshToken);

        const storedToken =
            await this.refreshTokenRepository.findOne({
                where: { tokenHash: hashedToken },
            });

        if (!storedToken) return;

        storedToken.revoked = true;
        await this.refreshTokenRepository.save(
            storedToken,
        );
    }

    private async generateAndStoreTokens(
        user: User,
    ): Promise<TokenPair> {
        const accessSecret: Secret =
            config.jwt.accessSecret as Secret;

        const refreshSecret: Secret =
            config.jwt.refreshSecret as Secret;

        const accessExpiresIn =
            config.jwt.accessExpiresIn as
                | StringValue
                | number;

        const refreshExpiresIn =
            config.jwt.refreshExpiresIn as
                | StringValue
                | number;

        const accessToken = jwt.sign(
            { userId: user.id },
            accessSecret,
            { expiresIn: accessExpiresIn },
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            refreshSecret,
            { expiresIn: refreshExpiresIn },
        );

        const decoded =
            jwt.decode(refreshToken) as JwtPayload;

        const refreshTokenEntity =
            this.refreshTokenRepository.create({
                tokenHash:
                    this.hashToken(refreshToken),
                expiresAt: new Date(
                    (decoded.exp || 0) * 1000,
                ),
                user,
            });

        await this.refreshTokenRepository.save(
            refreshTokenEntity,
        );

        return {
            accessToken,
            refreshToken,
        };
    }

    private hashToken(token: string): string {
        return crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
    }
}