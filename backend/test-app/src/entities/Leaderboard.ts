import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'leaderboard' })
export class Leaderboard {
    @PrimaryColumn('uuid', { name: 'user_id' })
    userId: string;

    @Column({ name: 'display_name' })
    displayName: string;

    @Column({ name: 'points' })
    points: number;

    @Column({ name: 'rank' })
    rank: number;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}