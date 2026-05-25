import { FastifyInstance } from 'fastify';
import { LeaderboardService } from '../services/LeaderboardService';

const leaderboardService = new LeaderboardService();

export default async function leaderboardRoutes(fastify: FastifyInstance) {
    // Leaderboard
    fastify.get('', async (request, reply) => {
        const query = request.query as {
            page?: number;
            limit?: number;
        };

        const result = await leaderboardService.getTopFans(query);
        return reply.send(result);
    });

    // My rank
    fastify.get('/me', async (request, reply) => {
        const userId = request.user!.userId;
        const result = await leaderboardService.getUserRank(userId);
        return reply.send(result);
    });
}