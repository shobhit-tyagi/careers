import { FastifyInstance } from 'fastify';
import { Static } from '@sinclair/typebox';
import { RewardService } from '../services/rewardService';
import { RewardValidator } from '../validators/rewardValidator';
import { RedeemRewardBody } from '../types/reward';

export default async function rewardRoutes(
    fastify: FastifyInstance,
    opts: { rewardService: RewardService }
) {
    // Rewards
    fastify.get('', async (request, reply) => {
        const rewards = await opts.rewardService.list();
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

            const result = await opts.rewardService.redeem(userId, id);

            return reply.send(result);
        },
    );

    // History of rewards
    fastify.get('/history', async (request, reply) => {
        const userId = request.user!.userId;
        const history = await opts.rewardService.getHistory(userId);
        return reply.send(history);
    });
}