import { DataSource } from 'typeorm';
import { Challenge } from '../../src/entities/Challenge';
import { User } from '../../src/entities/User';
import { randomUUID } from 'crypto';

export type CreateChallengeInput = {
    id?: string;
    title?: string;
    artist?: string;
    description?: string;
    pointsValue?: number;
    durationSeconds?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    isActive?: boolean;
};

export async function createChallenge(
    dataSource: DataSource,
    overrides: CreateChallengeInput = {}
): Promise<Challenge> {
    const repo = dataSource.getRepository(Challenge);

    const challenge = repo.create({
        id: overrides.id ?? randomUUID(),
        title: overrides.title ?? 'Test Challenge',
        artist: overrides.artist ?? 'Test Artist',
        description: overrides.description ?? 'Test Description',
        pointsValue: overrides.pointsValue ?? 10,
        durationSeconds: overrides.durationSeconds ?? 60,
        difficulty: (overrides.difficulty ?? 'easy') as any,
        isActive: overrides.isActive ?? true,
    } as Partial<Challenge>);

    return await repo.save(challenge);
}