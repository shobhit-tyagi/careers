import { dataSource } from '../plugins/db';
import { Leaderboard } from '../entities/Leaderboard';
import { User } from '../entities/User';
import { getRedis } from '../plugins/redis';

export class LeaderboardBuilderService {
    private leaderboardRepo = dataSource.getRepository(Leaderboard);
    private userRepo = dataSource.getRepository(User);

    async applyPointsChange(input: {
        userId: string;
        delta: number;
    }) {
        const { userId, delta } = input;

        await dataSource.transaction(async (manager) => {
            const leaderboardRepo = manager.getRepository(Leaderboard);
            const userRepo = manager.getRepository(User);

            const user = await userRepo.findOneByOrFail({ id: userId });

            let row = await leaderboardRepo.findOne({
                where: { userId },
            });

            if (!row) {
                row = leaderboardRepo.create({
                    userId,
                    displayName: user.displayName,
                    points: 0,
                    rank: 0,
                });
            }

            row.points += delta;
            row.displayName = user.displayName!;

            await leaderboardRepo.save(row);

            await manager.query(`
                WITH ranked AS (
                    SELECT
                        user_id,
                        RANK() OVER (ORDER BY points DESC) AS new_rank
                    FROM leaderboard
                )
                UPDATE leaderboard l
                SET rank = r.new_rank
                FROM ranked r
                WHERE l.user_id = r.user_id;
            `);
        });

        await this.invalidateCache(userId);
    }

    private async invalidateCache(userId: string) {
        const redis = getRedis();

        const keys = await redis.keys('leaderboard:top:*');
        if (keys.length) {
            await redis.del(keys);
        }

        await redis.del(`leaderboard:user:${userId}`);
    }
}