import { dataSource } from '../plugins/db';
import { Leaderboard } from '../entities/Leaderboard';
import { ApiResponse, PaginatedResponse } from '../types/api';

export class LeaderboardService {
    private repo = dataSource.getRepository(Leaderboard);

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

        const [rows, total] = await this.repo.findAndCount({
            order: { rank: 'ASC' },
            skip: offset,
            take: limit,
        });

        return {
            data: rows.map((r) => ({
                userId: r.userId,
                displayName: r.displayName,
                points: r.points,
                rank: r.rank,
            })),
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    async getUserRank(
        userId: string,
    ): Promise<
        ApiResponse<{
            rank: number | null;
            userId?: string;
            displayName?: string;
            points?: number;
        }>
    > {
        const user = await this.repo.findOne({
            where: { userId },
        });

        if (!user) {
            return {
                data: { rank: null },
            };
        }

        return {
            data: {
                rank: user.rank,
                userId: user.userId,
                displayName: user.displayName,
                points: user.points,
            },
        };
    }
}