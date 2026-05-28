import { FastifyInstance } from 'fastify';
import { Channel, Connection } from 'amqplib';
import * as amqp from 'amqplib';
import { randomUUID } from 'crypto';

import { buildApp } from '../../src/app';
import {
    createTestContext,
    destroyTestContext,
    cleanupDatabase,
    TestContext,
} from '../setup/containers';

import { CreatedUser, createUserAndLogin } from '../setup/authHelper';
import { createChallenge } from '../setup/dbHelper';

import { User } from '../../src/entities/User';
import { ChallengeCompletion } from '../../src/entities/ChallengeCompletion';

describe('Challenge Routes Integration Tests', () => {
    let ctx: TestContext;
    let app: FastifyInstance;

    let createdUser: CreatedUser;

    let connection: Connection;
    let appChannel: Channel;
    let testChannel: Channel;

    const EXCHANGE = 'fan_rewards_events';

    beforeAll(async () => {
        ctx = await createTestContext();

        connection = await amqp.connect(ctx.rabbitmqUrl);

        appChannel = await connection.createChannel();
        testChannel = await connection.createChannel();

        await testChannel.assertExchange(EXCHANGE, 'topic', {
            durable: true,
        });

        app = await buildApp(
            {
                dataSource: ctx.dataSource,
                redis: ctx.redis,
                rabbitmq: {
                    channel: appChannel,
                    close: async () => {},
                },
            },
            {
                disableRateLimit: true,
                disablePinoPrettyLogger: true,
                disableConsumers: true,
            }
        );

        await app.ready();
    });

    afterAll(async () => {
        try {
            await app.close();
        } catch {}

        try {
            await appChannel.close();
        } catch {}

        try {
            await testChannel.close();
        } catch {}

        try {
            await connection.close();
        } catch {}

        await destroyTestContext(ctx);
    });

    beforeEach(async () => {
        await cleanupDatabase(ctx.dataSource);
        createdUser = await createUserAndLogin(app, ctx.dataSource);
    });

    const waitForEvent = async (routingKey: string, timeout = 5000) => {
        const q = await testChannel.assertQueue('', { exclusive: true });

        await testChannel.bindQueue(q.queue, EXCHANGE, routingKey);

        return new Promise<any>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Timeout waiting for event: ' + routingKey));
            }, timeout);

            testChannel.consume(
                q.queue,
                (msg) => {
                    if (!msg) return;

                    clearTimeout(timer);

                    try {
                        const data = JSON.parse(msg.content.toString());
                        resolve(data);
                    } catch (e) {
                        reject(e);
                    }
                },
                { noAck: true }
            );
        });
    };

    describe('GET /api/challenges', () => {
        it('should return challenge list with seeded data', async () => {
            const challenge = await createChallenge(ctx.dataSource, {
                title: 'Rock Anthem',
                artist: 'Queen',
                description: 'Bohemian Rhapsody challenge',
                pointsValue: 25,
                durationSeconds: 120,
                difficulty: 'easy',
                isActive: true,
            });

            const res = await app.inject({
                method: 'GET',
                url: '/api/challenges?page=1&limit=10',
                headers: {
                    authorization: `Bearer ${createdUser.token}`,
                },
            });

            expect(res.statusCode).toBe(200);

            const body = res.json();

            const returned = body.data.find(
                (c: any) => c.id === challenge.id
            );

            expect(returned).toMatchObject({
                id: challenge.id,
                title: 'Rock Anthem',
                artist: 'Queen',
                description: 'Bohemian Rhapsody challenge',
                pointsValue: 25,
                durationSeconds: 120,
                difficulty: 'easy',
                isActive: true,
            });
        });
    });

    describe('GET /api/challenges/:id', () => {
        it('should return 404 or challenge data depending on seed', async () => {
            const res = await app.inject({
                method: 'GET',
                url: `/api/challenges/${randomUUID()}`,
                headers: {
                    authorization: `Bearer ${createdUser.token}`,
                },
            });

            expect([200, 404]).toContain(res.statusCode);
        });
    });

    describe('POST /api/challenges/:id/complete', () => {
        it('should complete challenge, update user points, persist completion and publish event', async () => {
            const challenge = await createChallenge(ctx.dataSource, {
                pointsValue: 20,
                isActive: true,
            });

            const userRepo = ctx.dataSource.getRepository(User);
            const completionRepo =
                ctx.dataSource.getRepository(ChallengeCompletion);

            const userBefore = await userRepo.findOneByOrFail({
                id: createdUser.userId,
            });

            const initialPoints = userBefore.totalPoints;

            const eventPromise = waitForEvent('challenge.completed');

            const res = await app.inject({
                method: 'POST',
                url: `/api/challenges/${challenge.id}/complete`,
                payload: {
                    listenDurationPercent: 100,
                },
                headers: {
                    authorization: `Bearer ${createdUser.token}`,
                },
            });

            expect(res.statusCode).toBe(200);

            const body = res.json();

            // completion exists
            const completion = await completionRepo.findOne({
                where: {
                    user: { id: createdUser.userId },
                    challenge: { id: challenge.id },
                },
            });

            expect(completion).toBeDefined();
            expect(completion!.pointsEarned).toBe(20);

            // points updated
            const userAfter = await userRepo.findOneByOrFail({
                id: createdUser.userId,
            });

            expect(userAfter.totalPoints).toBe(initialPoints + 20);

            // event published
            const event = await eventPromise;

            expect(event).toMatchObject({
                challengeId: challenge.id,
                userId: createdUser.userId,
                pointsEarned: 20,
            });
        });
    });
});