import {getRedis} from '../plugins/redis';
import { dataSource } from '../plugins/db';
import { Leaderboard } from '../entities/Leaderboard';

export class LeaderboardService {
    private repo = dataSource.getRepository(Leaderboard);

    async getTopFans(query: { page?: number; limit?: number }) {
        const redis = getRedis();
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 50);

        const cacheKey = `leaderboard:top:page:${page}:limit:${limit}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const offset = (page - 1) * limit;
        const [rows, total] = await this.repo.findAndCount({
            order: { rank: 'ASC' },
            skip: offset,
            take: limit,
        });

        const response = {
            data: rows.map((r) => ({
                userId: r.userId,
                displayName: r.displayName,
                points: r.points,
                rank: r.rank,
            })),
            meta: { page, limit, total },
        };

        await redis.set(cacheKey, JSON.stringify(response), 'EX', 60);
        return response;
    }

    async getUserRank(userId: string) {
        const redis = getRedis();
        const cacheKey = `leaderboard:user:${userId}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const user = await this.repo.findOne({
            where: { userId },
        });
        const response = !user
            ? { data: { rank: null } }
            : {
                data: {
                    rank: user.rank,
                    userId: user.userId,
                    displayName: user.displayName,
                    points: user.points,
                },
            };

        await redis.set(cacheKey, JSON.stringify(response), 'EX', 60);
        return response;
    }
}