import { FastifyInstance } from 'fastify';
import { Static } from '@sinclair/typebox';
import { UserValidator } from '../validators/userValidator';
import {UpdateProfileBody} from "../types/user";
import {UserService} from "../services/userService";

export default async function userRoutes(
    fastify: FastifyInstance,
    opts: { userService: UserService }
) {
    // Me
    fastify.get('/me', async (request, reply) => {
        const userId = request.user!.userId;
        const user = await opts.userService.getMe(userId);
        return reply.send(user);
    });

    // Update profile
    fastify.patch<{ Body: Static<typeof UpdateProfileBody> }>(
        '/me',
        { schema: { body: UpdateProfileBody } },
        async (request, reply) => {
            const userId = request.user!.userId;
            const body = request.body as Static<typeof UpdateProfileBody>;

            UserValidator.validateUpdateProfile(body);

            const updated = await opts.userService.updateProfile(userId, body);
            return reply.send(updated);
        },
    );

    // Stats
    fastify.get('/me/stats', async (request, reply) => {
        const userId = request.user!.userId;
        const stats = await opts.userService.getStats(userId);
        return reply.send(stats);
    });
}