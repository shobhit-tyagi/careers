import { DataSource } from 'typeorm';
import { config } from '../config';

import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { RewardRedemption } from '../entities/RewardRedemption';
import { Reward } from '../entities/Reward';
import { ChallengeCompletion } from '../entities/ChallengeCompletion';
import { Challenge } from '../entities/Challenge';

export const dataSource = new DataSource({
    type: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,

    entities: [
        User,
        RefreshToken,
        Challenge,
        ChallengeCompletion,
        Reward,
        RewardRedemption,
    ],

    migrations: ['src/migrations/*.ts'],

    synchronize: false,
    logging: false,

    extra: {
        max: config.db.pool.max,
        min: config.db.pool.min,
        idleTimeoutMillis: config.db.pool.idleTimeoutMillis,
        connectionTimeoutMillis: config.db.pool.connectionTimeoutMillis,
        keepAlive: config.db.pool.keepAlive,
    },
});

// Fastify plugin to initialize database
export const dbPlugin = async (fastify: any) => {
    if (!dataSource.isInitialized) {
        await dataSource.initialize();
    }
    fastify.decorate('db', dataSource);
};