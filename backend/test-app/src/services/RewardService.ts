import {dataSource} from '../plugins/db';
import {Reward} from '../entities/Reward';
import {
    RedemptionStatus,
    RewardRedemption,
} from '../entities/RewardRedemption';
import {User} from '../entities/User';
import {AppError} from '../types/errors';
import {ApiResponse} from '../types/api';

export class RewardService {
    private rewardRepo = dataSource.getRepository(Reward);
    private redemptionRepo =
        dataSource.getRepository(RewardRedemption);
    private userRepo = dataSource.getRepository(User);

    async list(): Promise<ApiResponse<Reward[]>> {
        const rewards = await this.rewardRepo.find({
            where: {isActive: true},
        });

        return {data: rewards};
    }

    async redeem(
        userId: string,
        rewardId: string,
    ): Promise<
        ApiResponse<{
            redemptionId: string;
            remainingPoints: number;
        }>
    > {
        return await dataSource.transaction(
            async (manager) => {
                const userRepoTx = manager.getRepository(User);
                const rewardRepoTx = manager.getRepository(Reward);
                const redemptionRepoTx =
                    manager.getRepository(RewardRedemption);

                // lock user row (prevents concurrent spend)
                const user = await userRepoTx.findOne({
                    where: {id: userId},
                    lock: {mode: 'pessimistic_write'},
                });

                if (!user) {
                    throw new AppError(
                        404,
                        'User not found',
                        'NOT_FOUND',
                    );
                }

                const reward = await rewardRepoTx.findOne({
                    where: {
                        id: rewardId,
                        isActive: true,
                    },
                });

                if (!reward) {
                    throw new AppError(
                        404,
                        'Reward not found',
                        'NOT_FOUND',
                    );
                }

                if (user.totalPoints < reward.pointsCost) {
                    throw new AppError(
                        400,
                        'Insufficient points',
                        'INSUFFICIENT_POINTS',
                    );
                }

                // deduct points safely inside transaction
                user.totalPoints -= reward.pointsCost;
                await userRepoTx.save(user);

                const redemption = redemptionRepoTx.create({
                    user,
                    reward,
                    pointsSpent: reward.pointsCost,
                    status: RedemptionStatus.PENDING,
                });

                await redemptionRepoTx.save(redemption);

                return {
                    data: {
                        redemptionId: redemption.id,
                        remainingPoints: user.totalPoints,
                    },
                };
            },
        );
    }

    async getHistory(
        userId: string,
    ): Promise<ApiResponse<RewardRedemption[]>> {
        const history = await this.redemptionRepo.find({
            where: {user: {id: userId}},
            relations: ['reward'],
            order: {createdAt: 'DESC'},
        });

        return {
            data: history,
        };
    }
}