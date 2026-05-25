import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';

import { RewardRedemption } from './RewardRedemption';

@Entity('rewards')
export class Reward {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column()
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Index()
    @Column({ name: 'points_cost' })
    pointsCost: number;

    @Index()
    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @OneToMany(() => RewardRedemption, (rr) => rr.reward)
    redemptions: RewardRedemption[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}