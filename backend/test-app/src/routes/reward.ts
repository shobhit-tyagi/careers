import { FastifyInstance } from 'fastify';
import { Static } from '@sinclair/typebox';
import { RewardService } from '../services/RewardService';
import { RewardValidator } from '../validators/rewardValidator';
import { RedeemRewardBody } from '../types/reward';

const rewardService = new RewardService();

export default async function rewardRoutes(fastify: FastifyInstance) {
    // Rewards
    fastify.get('', async (request, reply) => {
        const rewards = await rewardService.list();
        return reply.send(rewards);
    });

    // Redeem a reward
    fastify.post<{ Body: Static<typeof RedeemRewardBody> }>(
        '/:id/redeem',
        async (request, reply) => {
            const userId = request.user!.userId;
            const { id } = request.params as { id: string };
            const body = request.body as Static<typeof RedeemRewardBody>;

            RewardValidator.validateRedeem(id, body);

            const result = await rewardService.redeem(userId, id);

            return reply.send(result);
        },
    );

    // History of rewards
    fastify.get('/history', async (request, reply) => {
        const userId = request.user!.userId;
        const history = await rewardService.getHistory(userId);
        return reply.send(history);
    });
}