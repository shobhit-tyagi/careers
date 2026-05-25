import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';

import { ChallengeCompletion } from './ChallengeCompletion';

export enum ChallengeDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
}

@Entity('challenges')
export class Challenge {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    title: string;

    @Column()
    artist: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ name: 'points_value' })
    pointsValue: number;

    @Column({ name: 'duration_seconds' })
    durationSeconds: number;

    @Column({
        type: 'enum',
        enum: ChallengeDifficulty,
    })
    difficulty: ChallengeDifficulty;

    @Index()
    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @OneToMany(() => ChallengeCompletion, (cc) => cc.challenge)
    completions: ChallengeCompletion[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}