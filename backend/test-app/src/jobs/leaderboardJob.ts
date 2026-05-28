import { User } from '../entities/User';
import {DataSource} from "typeorm";
import Redis from "ioredis";

export async function rebuildLeaderboardJob(dataSource: DataSource, redis: Redis) {
    const userRepo = dataSource.getRepository(User);
    const users = await userRepo.find({
        select: ['id', 'displayName', 'totalPoints'],
    });

    const sorted = users
        .map(u => ({
            userId: u.id,
            displayName: u.displayName ?? '',
            points: u.totalPoints ?? 0,
        }))
        .sort((a, b) => b.points - a.points)
        .map((u, idx) => ({
            ...u,
            rank: idx + 1,
        }));

    await redis.set(
        'leaderboard:snapshot',
        JSON.stringify(sorted),
    );
}