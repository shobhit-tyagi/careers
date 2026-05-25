import { dataSource } from '../plugins/db';
import { Challenge } from '../entities/Challenge';
import { ChallengeCompletion } from '../entities/ChallengeCompletion';
import { User } from '../entities/User';
import { AppError } from '../types/errors';
import { ApiResponse, PaginatedResponse } from '../types/api';
import { getChannel, EXCHANGE } from '../plugins/rabbitmq';

const FULL_REWARD_THRESHOLD_PERCENT = Number(
    process.env.FULL_REWARD_THRESHOLD_PERCENT ?? 80,
);

export class ChallengeService {
    private challengeRepo = dataSource.getRepository(Challenge);
    private completionRepo = dataSource.getRepository(ChallengeCompletion);
    private userRepo = dataSource.getRepository(User);

    async listChallenges(query: {
        page?: number;
        limit?: number;
        difficulty?: string;
        active?: string;
    }): Promise<PaginatedResponse<Challenge>> {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 50);
        const skip = (page - 1) * limit;

        const qb = this.challengeRepo.createQueryBuilder('c');

        if (query.difficulty) {
            qb.andWhere('c.difficulty = :difficulty', {
                difficulty: query.difficulty,
            });
        }

        if (query.active !== undefined) {
            qb.andWhere('c.isActive = :active', {
                active: query.active === 'true',
            });
        }

        qb.skip(skip).take(limit);

        const [items, total] = await qb.getManyAndCount();

        return {
            data: items,
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    async getChallengeById(id: string): Promise<ApiResponse<Challenge>> {
        const challenge = await this.challengeRepo.findOne({
            where: { id },
        });

        if (!challenge) {
            throw new AppError(404, 'Challenge not found', 'NOT_FOUND');
        }

        return {
            data: challenge,
        };
    }

    async completeChallenge(
        userId: string,
        challengeId: string,
        body: { listenDurationPercent: number },
    ): Promise<
        ApiResponse<{
            pointsEarned: number;
            totalPoints: number;
        }>
    > {
        const percent = Math.max(
            0,
            Math.min(100, body.listenDurationPercent),
        );

        const user = await this.userRepo.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
        }

        const challenge = await this.challengeRepo.findOne({
            where: { id: challengeId },
        });

        if (!challenge) {
            throw new AppError(404, 'Challenge not found', 'NOT_FOUND');
        }

        // points logic
        const pointsEarned =
            percent >= FULL_REWARD_THRESHOLD_PERCENT
                ? challenge.pointsValue
                : Math.floor(
                    (challenge.pointsValue * percent) / 100,
                );

        const completion = this.completionRepo.create({
            user,
            challenge,
            pointsEarned,
            listenDurationPercent: percent,
        });

        await this.completionRepo.save(completion);
        user.totalPoints = (user.totalPoints ?? 0) + pointsEarned;
        await this.userRepo.save(user);

        const channel = getChannel();
        channel.publish(
            EXCHANGE,
            'challenge.completed',
            Buffer.from(
                JSON.stringify({
                    userId,
                    challengeId,
                    pointsEarned,
                    totalPoints: user.totalPoints,
                    listenDurationPercent: percent,
                    timestamp: new Date().toISOString(),
                }),
            ),
            {
                persistent: true,
            },
        );

        return {
            data: {
                pointsEarned,
                totalPoints: user.totalPoints,
            },
        };
    }
}