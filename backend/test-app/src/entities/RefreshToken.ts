import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('refresh_tokens')
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    tokenHash!: string;

    @Column()
    expiresAt!: Date;

    @Column({ default: false })
    revoked!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;
}