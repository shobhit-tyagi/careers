import { FastifyInstance } from 'fastify';
import { LeaderboardService } from '../services/leaderboardService';
import {ChallengeService} from "../services/challengeService";

export default async function leaderboardRoutes(
    fastify: FastifyInstance,
    opts: { leaderboardService: LeaderboardService }
) {
    // Leaderboard
    fastify.get('', async (request, reply) => {
        const query = request.query as {
            page?: number;
            limit?: number;
        };

        const result = await opts.leaderboardService.getTopFans(query);
        return reply.send(result);
    });

    // My rank
    fastify.get('/me', async (request, reply) => {
        const userId = request.user!.userId;
        const result = await opts.leaderboardService.getUserRank(userId);
        return reply.send(result);
    });
}