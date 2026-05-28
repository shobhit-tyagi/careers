import { User } from '../entities/User';
import { ChallengeCompletion } from '../entities/ChallengeCompletion';
import { RewardRedemption } from '../entities/RewardRedemption';
import { AppError } from '../types/errors';
import { ApiResponse } from '../types/api';
import {DataSource} from "typeorm";

export class UserService {
    constructor(
        private readonly dataSource: DataSource
    ) {}
    private userRepo =
        this.dataSource.getRepository(User);
    private completionRepo =
        this.dataSource.getRepository(
            ChallengeCompletion,
        );
    private redemptionRepo =
        this.dataSource.getRepository(
            RewardRedemption,
        );

    async getMe(
        userId: string,
    ): Promise<ApiResponse<User>> {
        const user =
            await this.userRepo.findOne({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    displayName: true,
                    totalPoints: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        if (!user) {
            throw new AppError(
                404,
                'User not found',
                'USER_NOT_FOUND',
            );
        }

        return {
            data: user,
        };
    }

    async updateProfile(
        userId: string,
        payload: { displayName?: string },
    ): Promise<
        ApiResponse<{
            id: string;
            email: string;
            displayName: string;
            totalPoints: number;
        }>
    > {
        const user =
            await this.userRepo.findOne({
                where: { id: userId },
            });

        if (!user) {
            throw new AppError(
                404,
                'User not found',
                'USER_NOT_FOUND',
            );
        }

        if (payload.displayName !== undefined) {
            user.displayName =
                payload.displayName;
        }

        await this.userRepo.save(user);

        return {
            data: {
                id: user.id,
                email: user.email,
                displayName: user.displayName ?? '',
                totalPoints: user.totalPoints,
            },
        };
    }

    async getStats(
        userId: string,
    ): Promise<
        ApiResponse<{
            completionCount: number;
            redemptionCount: number;
            totalPointsEarned: number;
            totalPointsSpent: number;
            netPoints: number;
        }>
    > {
        const user =
            await this.userRepo.findOne({
                where: { id: userId },
            });

        if (!user) {
            throw new AppError(
                404,
                'User not found',
                'USER_NOT_FOUND',
            );
        }

        const [
            completionCount,
            redemptionCount,
        ] = await Promise.all([
            this.completionRepo.count({
                where: { user: { id: userId } },
            }),
            this.redemptionRepo.count({
                where: { user: { id: userId } },
            }),
        ]);

        const totalEarned =
            await this.completionRepo
                .createQueryBuilder('c')
                .select(
                    'SUM(c.pointsEarned)',
                    'sum',
                )
                .where(
                    'c.user_id = :userId',
                    { userId },
                )
                .getRawOne();

        const totalSpent =
            await this.redemptionRepo
                .createQueryBuilder('r')
                .select(
                    'SUM(r.points_spent)',
                    'sum',
                )
                .where(
                    'r.user_id = :userId',
                    { userId },
                )
                .getRawOne();

        const earned = Number(
            totalEarned?.sum || 0,
        );
        const spent = Number(
            totalSpent?.sum || 0,
        );

        return {
            data: {
                completionCount,
                redemptionCount,
                totalPointsEarned: earned,
                totalPointsSpent: spent,
                netPoints: user.totalPoints,
            },
        };
    }
}