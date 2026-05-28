import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';

import {
    createTestContext,
    destroyTestContext,
    cleanupDatabase,
    TestContext,
} from '../setup/containers';
import {CreatedUser, createUserAndLogin} from "../setup/authHelper";

describe('User Routes Integration Tests', () => {
    let ctx: TestContext;
    let app: FastifyInstance;

    let createdUser: CreatedUser;

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
                disableConsumers: true
            }
        );

        await app.ready();
    });

    beforeEach(async () => {
        await cleanupDatabase(ctx.dataSource);
        createdUser = await createUserAndLogin(app, ctx.dataSource);
    });

    afterAll(async () => {
        await app.close();
        await destroyTestContext(ctx);
    });

    it('GET /api/user/me returns user', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/user/me',
            headers: {
                authorization: `Bearer ${createdUser.token}`,
            },
        });

        expect(res.statusCode).toBe(200);

        const body = res.json();

        expect(body.data).toBeDefined();
        expect(body.data.email).toBe('user@test.com');
        expect(body.data.displayName).toBe('User');
    });

    it('PATCH /api/user/me updates profile', async () => {
        const res = await app.inject({
            method: 'PATCH',
            url: '/api/user/me',
            headers: {
                authorization: `Bearer ${createdUser.token}`,
            },
            payload: {
                displayName: 'Updated Name',
            },
        });

        expect(res.statusCode).toBe(200);

        const body = res.json();

        expect(body.data.displayName).toBe('Updated Name');
    });

    it('PATCH /api/user/me rejects invalid payload', async () => {
        const res = await app.inject({
            method: 'PATCH',
            url: '/api/user/me',
            headers: {
                authorization: `Bearer ${createdUser.token}`,
            },
            payload: {
                displayName: "a", // invalid
            },
        });

        expect(res.statusCode).toBe(400);
    });

    it('GET /api/user/me/stats returns stats', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/api/user/me/stats',
            headers: {
                authorization: `Bearer ${createdUser.token}`,
            },
        });

        expect(res.statusCode).toBe(200);

        const body = res.json();

        expect(body.data).toBeDefined();
        expect(typeof body.data.completionCount).toBe('number');
        expect(typeof body.data.redemptionCount).toBe('number');
        expect(typeof body.data.totalPointsEarned).toBe('number');
        expect(typeof body.data.totalPointsSpent).toBe('number');
        expect(typeof body.data.netPoints).toBe('number');
    });
});