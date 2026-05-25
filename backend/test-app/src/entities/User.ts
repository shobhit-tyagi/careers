import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany
} from 'typeorm';

import { ChallengeCompletion } from './ChallengeCompletion';
import { RewardRedemption } from './RewardRedemption';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ name: 'password_hash' })
    passwordHash: string;

    @Column({ name: 'total_points', default: 0 })
    totalPoints: number;

    @Column({ name: 'display_name', nullable: true })
    displayName?: string;

    @Column({ name: 'failed_login_attempts', default: 0 })
    failedLoginAttempts: number;

    @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
    lockedUntil?: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => ChallengeCompletion, (cc) => cc.user)
    challengeCompletions: ChallengeCompletion[];

    @OneToMany(() => RewardRedemption, (rr) => rr.user)
    rewardRedemptions: RewardRedemption[];
}
