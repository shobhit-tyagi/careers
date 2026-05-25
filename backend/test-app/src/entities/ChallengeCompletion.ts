import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { Challenge } from './Challenge';
import { User } from './User';

@Entity('challenge_completions')
@Index(['user', 'createdAt'])
@Index(['challenge'])
export class ChallengeCompletion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.challengeCompletions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Challenge, (challenge) => challenge.completions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'challenge_id' })
    challenge: Challenge;

    @Column({ name: 'points_earned' })
    pointsEarned: number;

    @Column({ name: 'listen_duration_percent', type: 'float' })
    listenDurationPercent: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}