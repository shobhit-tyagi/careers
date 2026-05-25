import { dataSource } from '../plugins/db';
import { User } from '../entities/User';
import { ApiResponse, PaginatedResponse } from '../types/api';

export class LeaderboardService {
    private userRepo = dataSource.getRepository(User);

    async getTopFans(query: {
        page?: number;
        limit?: number;
    }): Promise<
        PaginatedResponse<{
            userId: string;
            displayName: string;
            points: number;
            rank: number;
        }>
    > {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 50);
        const offset = (page - 1) * limit;

        // rank computed in DB (handles ties correctly)
        const ranked = await this.userRepo
            .createQueryBuilder('u')
            .select([
                'u.id AS userId',
                'u.displayName AS displayName',
                'u.totalPoints AS points',
                'RANK() OVER (ORDER BY u.totalPoints DESC) AS rank',
            ])
            .orderBy('u.totalPoints', 'DESC')
            .addOrderBy('u.id', 'ASC') // deterministic tie-breaker
            .offset(offset)
            .limit(limit)
            .getRawMany();

        const total = await this.userRepo.count();

        return {
            data: ranked.map((r) => ({
                userId: r.userId,
                displayName: r.displayName ?? '',
                points: Number(r.points),
                rank: Number(r.rank),
            })),
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    async getUserRank(userId: string): Promise<
        ApiResponse<{
            rank: number | null;
            userId?: string;
            displayName?: string;
            points?: number;
        }>
    > {
        const result = await this.userRepo
            .createQueryBuilder('u')
            .select([
                'u.id AS userId',
                'u.displayName AS displayName',
                'u.totalPoints AS points',
                'RANK() OVER (ORDER BY u.totalPoints DESC) AS rank',
            ])
            .where('u.id = :userId', { userId })
            .getRawOne();

        if (!result) {
            return {
                data: { rank: null },
            };
        }

        return {
            data: {
                rank: Number(result.rank),
                userId: result.userId,
                displayName: result.displayName,
                points: Number(result.points),
            },
        };
    }
}