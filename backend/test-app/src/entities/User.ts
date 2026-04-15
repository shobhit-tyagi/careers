import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

// TODO: Import and set up relations with ChallengeCompletion and RewardRedemption

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: 0 })
  totalPoints!: number;

  @Column({ nullable: true })
  displayName!: string | null;

  // TODO: Add @OneToMany relations for completions and redemptions

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
