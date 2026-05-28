import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import {
    createTestContext,
    destroyTestContext,
    cleanupDatabase,
    TestContext,
} from '../setup/containers';

import { User } from '../../src/entities/User';
import { rebuildLeaderboardJob } from '../../src/jobs/leaderboardJob';
import {CreatedUser, createUserAndLogin} from "../setup/authHelper";

describe('Leaderboard Routes Integration Tests', () => {
    let ctx: TestContext;
    let app: FastifyInstance;

    let userA: CreatedUser;
    let userB: CreatedUser;
    let userC: CreatedUser;

    beforeAll(async () => {
        ctx = await createTestContext();

        app = await buildApp(
            {
                dataSource: ctx.dataSource,
                redis: ctx.redis,
                rabbitmq: {
                    channel: null as any,
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
        await app.close();
        await destroyTestContext(ctx);
    });

    beforeEach(async () => {
        await cleanupDatabase(ctx.dataSource);

        const repo = ctx.dataSource.getRepository(User);
        const userRepo = ctx.dataSource.getRepository(User);

        userA = await createUserAndLogin(app, ctx.dataSource, 'a@test.com', 'AAA')
        await userRepo.update(
            { id: userA.userId },
            { totalPoints: 100 }
        );

        userB = await createUserAndLogin(app, ctx.dataSource, 'b@test.com', 'BBB')
        await userRepo.update(
            { id: userB.userId },
            { totalPoints: 200 }
        );

        userC = await createUserAndLogin(app, ctx.dataSource, 'c@test.com', 'CCC')
        await userRepo.update(
            { id: userC.userId },
            { totalPoints: 50}
        );

        // rebuild leaderboard snapshot into SAME redis instance used by app
        await rebuildLeaderboardJob(ctx.dataSource, ctx.redis);
    });

    describe('GET /api/leaderboard', () => {
        it('returns sorted leaderboard from redis', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/api/leaderboard?page=1&limit=10',
                headers: {
                    authorization: `Bearer ${userA.token}`,
                },
            });

            expect(res.statusCode).toBe(200);

            const body = res.json();

            expect(body.data.length).toBe(3);

            expect(body.data[0].points).toBe(200);
            expect(body.data[1].points).toBe(100);
            expect(body.data[2].points).toBe(50);
        });
    });

    describe('GET /api/leaderboard/me', () => {
        it('returns correct user rank', async () => {
            const res = await app.inject({
                method: 'GET',
                url: '/api/leaderboard/me',
                headers: {
                    authorization: `Bearer ${userB.token}`,
                },
            });

            expect(res.statusCode).toBe(200);

            const body = res.json();

            expect(body.data.rank).toBe(1);
            expect(body.data.points).toBe(200);
            expect(body.data.displayName).toBe('BBB');
        });

        it('returns null rank if user not in leaderboard', async () => {
            const userX = await createUserAndLogin(app, ctx.dataSource, 'x@test.com', 'XXX')
            const res = await app.inject({
                method: 'GET',
                url: '/api/leaderboard/me',
                headers: {
                    authorization: `Bearer ${userX.token}`,
                },
            });

            expect(res.statusCode).toBe(200);
            const body = res.json();
            expect(body.data.rank).toBeNull();
        });
    });
});