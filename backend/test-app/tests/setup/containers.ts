import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

import {
    RedisContainer,
    StartedRedisContainer,
} from '@testcontainers/redis';

import {
    RabbitMQContainer,
    StartedRabbitMQContainer,
} from '@testcontainers/rabbitmq';

import { DataSource } from 'typeorm';
import Redis from 'ioredis';

import { User } from '../../src/entities/User';
import { RefreshToken } from '../../src/entities/RefreshToken';
import { Challenge } from '../../src/entities/Challenge';
import { ChallengeCompletion } from '../../src/entities/ChallengeCompletion';
import { Reward } from '../../src/entities/Reward';
import { RewardRedemption } from '../../src/entities/RewardRedemption';

export type TestContext = {
    postgres: StartedPostgreSqlContainer;
    redisContainer: StartedRedisContainer;
    rabbitContainer: StartedRabbitMQContainer;

    dataSource: DataSource;
    redis: Redis;

    rabbitmqUrl: string;
};

export async function createTestContext(): Promise<TestContext> {
    const postgres = await new PostgreSqlContainer('postgres:16-alpine')
        .withDatabase('testdb')
        .withUsername('test')
        .withPassword('test')
        .start();

    const redisContainer = await new RedisContainer('redis:7-alpine').start();

    const rabbitContainer = await new RabbitMQContainer(
        'rabbitmq:3-management'
    ).start();

    const dataSource = new DataSource({
        type: 'postgres',
        host: postgres.getHost(),
        port: postgres.getPort(),
        username: postgres.getUsername(),
        password: postgres.getPassword(),
        database: postgres.getDatabase(),
        entities: [
            User,
            RefreshToken,
            Challenge,
            ChallengeCompletion,
            Reward,
            RewardRedemption,
        ],
        synchronize: true,
        dropSchema: true,
    });

    await dataSource.initialize();

    const redis = new Redis({
        host: redisContainer.getHost(),
        port: redisContainer.getPort(),
    });

    return {
        postgres,
        redisContainer,
        rabbitContainer,
        dataSource,
        redis,
        rabbitmqUrl: rabbitContainer.getAmqpUrl(),
    };
}

export async function cleanupDatabase(dataSource: DataSource) {
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
        await dataSource.query(
            `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`
        );
    }
}

export async function destroyTestContext(ctx: TestContext) {
    await ctx.dataSource.destroy();
    await ctx.redis.quit();

    await ctx.rabbitContainer.stop();
    await ctx.redisContainer.stop();
    await ctx.postgres.stop();
}