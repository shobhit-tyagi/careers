import Redis from "ioredis";

export class LeaderboardService {
    constructor(
        private readonly redis: Redis
    ) {}
    async getTopFans(query: { page?: number; limit?: number }) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 50);
        const raw = await this.redis.get('leaderboard:snapshot');
        // TODO in prod this should be backed by a db table but in this task there is no such entity
        const leaderboard = raw ? JSON.parse(raw) : [];
        const offset = (page - 1) * limit;
        return {
            data: leaderboard.slice(offset, offset + limit),
            meta: {
                page,
                limit,
                total: leaderboard.length,
            },
        };
    }

    async getUserRank(userId: string) {
        const raw = await this.redis.get('leaderboard:snapshot');
        const leaderboard = raw ? JSON.parse(raw) : [];
        const index = leaderboard.findIndex((u: any) => u.userId === userId);
        if (index === -1) {
            return { data: { rank: null } };
        }

        return {
            data: {
                ...leaderboard[index],
                rank: index + 1,
            },
        };
    }
}