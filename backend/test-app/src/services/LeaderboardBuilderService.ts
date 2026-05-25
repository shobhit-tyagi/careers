import { getChannel, EXCHANGE } from '../plugins/rabbitmq';
import { dataSource } from '../plugins/db';
import { Leaderboard } from '../entities/Leaderboard';
import { User } from '../entities/User';
import {getRedis} from '../plugins/redis';

type ChallengeCompletedEvent = {
    userId: string;
    pointsEarned: number;
    challengeId: string;
    listenDurationPercent: number;
    timestamp: string;
};

export function startLeaderboardConsumer() {
    const channel = getChannel();

    channel.assertQueue('leaderboard.queue', { durable: true });
    channel.bindQueue('leaderboard.queue', EXCHANGE, 'challenge.completed');

    channel.consume('leaderboard.queue', async (msg) => {
        if (!msg) return;

        try {
            const event: ChallengeCompletedEvent = JSON.parse(
                msg.content.toString(),
            );

            await handleEvent(event);

            channel.ack(msg);
        } catch (err) {
            console.error('leaderboard consumer failed', err);
            channel.nack(msg, false, true);
        }
    });
}

async function handleEvent(event: ChallengeCompletedEvent) {
    const cache = getRedis();
    await dataSource.transaction(async (manager) => {
        const leaderboardRepo = manager.getRepository(Leaderboard);
        const userRepo = manager.getRepository(User);

        const user = await userRepo.findOne({
            where: { id: event.userId },
            select: ['id', 'displayName'],
        });

        let row = await leaderboardRepo.findOne({
            where: { userId: event.userId },
        });

        if (!row) {
            row = leaderboardRepo.create({
                userId: event.userId,
                displayName: user?.displayName ?? '',
                points: 0,
                rank: 0,
            });
        }

        row.points += event.pointsEarned;
        row.displayName = user?.displayName ?? row.displayName;

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

        const keys = await cache.keys('leaderboard:top:*');
        if (keys.length > 0) {
            await cache.del(keys);
        }
        await cache.del(`leaderboard:user:${event.userId}`);
    });
}