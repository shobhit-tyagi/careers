import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

// TODO: Import and set up relation with ChallengeCompletion

@Entity()
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  artist!: string;

  @Column()
  description!: string;

  @Column()
  points!: number;

  @Column()
  durationSeconds!: number;

  @Column({ type: 'varchar' })
  difficulty!: 'easy' | 'medium' | 'hard';

  @Column({ default: true })
  isActive!: boolean;

  // TODO: Add @OneToMany relation for completions

  @CreateDateColumn()
  createdAt!: Date;
}
