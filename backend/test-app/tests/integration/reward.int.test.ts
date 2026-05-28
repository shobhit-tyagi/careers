import { FastifyInstance } from 'fastify';
import { Channel, Connection } from 'amqplib';
import * as amqp from 'amqplib';

import { buildApp } from '../../src/app';
import {
    createTestContext,
    destroyTestContext,
    cleanupDatabase,
    TestContext,
} from '../setup/containers';

import { CreatedUser, createUserAndLogin } from '../setup/authHelper';
import { randomUUID } from 'crypto';

import { User } from '../../src/entities/User';
import { Reward } from '../../src/entities/Reward';
import { RewardRedemption } from '../../src/entities/RewardRedemption';

describe('Reward Routes Integration Tests', () => {
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

                    const data = JSON.parse(msg.content.toString());
                    resolve(data);
                },
                { noAck: true }
            );
        });
    };

    describe('GET /api/rewards', () => {
        it('should return active rewards', async () => {
            const repo = ctx.dataSource.getRepository(Reward);

            const reward = await repo.save(
                repo.create({
                    id: randomUUID(),
                    name: 'Gift Card',
                    description: 'Amazon voucher',
                    pointsCost: 50,
                    isActive: true,
                })
            );

            const res = await app.inject({
                method: 'GET',
                url: '/api/rewards',
                headers: {
                    authorization: `Bearer ${createdUser.token}`,
                },
            });

            expect(res.statusCode).toBe(200);

            const body = res.json();

            expect(body.data).toBeDefined();
            expect(Array.isArray(body.data)).toBe(true);

            const found = body.data.find((r: any) => r.id === reward.id);

            expect(found).toBeDefined();
            expect(found.name).toBe('Gift Card');
            expect(found.pointsCost).toBe(50);
        });
    });

    describe('POST /api/rewards/:id/redeem', () => {
        it('should redeem reward, deduct points, create redemption and publish event', async () => {
            const userRepo = ctx.dataSource.getRepository(User);
            const rewardRepo = ctx.dataSource.getRepository(Reward);
            const redemptionRepo = ctx.dataSource.getRepository(RewardRedemption);

            const reward = await rewardRepo.save(
                rewardRepo.create({
                    id: randomUUID(),
                    name: 'Spotify Premium',
                    description: '1 month',
                    pointsCost: 30,
                    isActive: true,
                })
            );

            await userRepo.update(
                { id: createdUser.userId },
                { totalPoints: 100 }
            );

            const initialPoints = 100;
            const eventPromise = waitForEvent('reward.redeemed');

            const res = await app.inject({
                method: 'POST',
                url: `/api/rewards/${reward.id}/redeem`,
                headers: {
                    authorization: `Bearer ${createdUser.token}`,
                },
            });

            expect(res.statusCode).toBe(200);

            const body = res.json();

            expect(body.data.redemptionId).toBeDefined();
            expect(body.data.remainingPoints).toBe(
                initialPoints - reward.pointsCost
            );

            const redemption = await redemptionRepo.findOne({
                where: {
                    user: { id: createdUser.userId },
                    reward: { id: reward.id },
                },
                relations: ['user', 'reward'],
            });

            expect(redemption).toBeDefined();
            expect(redemption!.pointsSpent).toBe(reward.pointsCost);

            const userAfter = await userRepo.findOneByOrFail({
                id: createdUser.userId,
            });

            expect(userAfter.totalPoints).toBe(
                initialPoints - reward.pointsCost
            );

            const event = await eventPromise;

            expect(event).toMatchObject({
                userId: createdUser.userId,
                rewardId: reward.id,
                redemptionId: body.data.redemptionId,
                pointsSpent: reward.pointsCost,
            });
        });
    });

    describe('GET /api/rewards/history', () => {
        it('should return redemption history', async () => {
            const rewardRepo = ctx.dataSource.getRepository(Reward);
            const redemptionRepo = ctx.dataSource.getRepository(RewardRedemption);

            const reward = await rewardRepo.save(
                rewardRepo.create({
                    id: randomUUID(),
                    name: 'History Reward',
                    description: 'test',
                    pointsCost: 10,
                    isActive: true,
                })
            );

            await redemptionRepo.save(
                redemptionRepo.create({
                    user: { id: createdUser.userId } as any,
                    reward,
                    pointsSpent: 10,
                    status: 'pending' as any,
                })
            );

            const res = await app.inject({
                method: 'GET',
                url: '/api/rewards/history',
                headers: {
                    authorization: `Bearer ${createdUser.token}`,
                },
            });

            expect(res.statusCode).toBe(200);

            const body = res.json();

            expect(body.data).toBeDefined();
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.data.length).toBeGreaterThan(0);

            expect(body.data[0]).toHaveProperty('reward');
        });
    });
});