import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { User } from './User';
import { Reward } from './Reward';

export enum RedemptionStatus {
    PENDING = 'pending',
    FULFILLED = 'fulfilled',
    CANCELLED = 'cancelled',
}

@Entity('reward_redemptions')
@Index(['user', 'createdAt'])
@Index(['status'])
export class RewardRedemption {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.rewardRedemptions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Reward, (reward) => reward.redemptions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'reward_id' })
    reward: Reward;

    @Column({ name: 'points_spent' })
    pointsSpent: number;

    @Column({
        type: 'enum',
        enum: RedemptionStatus,
        default: RedemptionStatus.PENDING,
    })
    status: RedemptionStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}