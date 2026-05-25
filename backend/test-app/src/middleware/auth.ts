import { FastifyReply, FastifyRequest } from 'fastify';
import jwt, { Secret } from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../types/errors';

type AuthUser = {
    userId: string;
};

export async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing token');
    }

    const token = header.slice(7);

    try {
        const decoded = jwt.verify(
            token,
            config.jwt.accessSecret as Secret,
        ) as AuthUser;

        if (!decoded.userId) {
            throw new UnauthorizedError('Invalid token');
        }

        request.user = {
            userId: decoded.userId,
        };
    } catch {
        throw new UnauthorizedError('Invalid or expired token');
    }
}