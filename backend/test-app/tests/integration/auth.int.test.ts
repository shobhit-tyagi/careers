import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';

import {
    createTestContext,
    destroyTestContext,
    cleanupDatabase,
    TestContext,
} from '../setup/containers';

describe('Auth Integration Tests', () => {
    let ctx: TestContext;
    let app: FastifyInstance;

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
    });

    afterAll(async () => {
        await app.close();
        await destroyTestContext(ctx);
    });

    describe('POST /api/auth/register', () => {
        it('should register user', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/register',

                payload: {
                    email: 'john@example.com',
                    password: 'Password123',
                    displayName: 'John',
                },
            });

            expect(response.statusCode).toBe(201);

            const body = response.json();
            expect(body.data.userId).toBeDefined();
            expect(body.data.accessToken).toBeDefined();
            expect(body.data.refreshToken).toBeDefined();
        });

        it('should fail if user exists', async () => {
            await app.inject({
                method: 'POST',
                url: '/api/auth/register',

                payload: {
                    email: 'john@example.com',
                    password: 'Password123',
                    displayName: 'John',
                },
            });

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/register',

                payload: {
                    email: 'john@example.com',
                    password: 'Password123',
                    displayName: 'John',
                },
            });

            expect(response.statusCode).toBe(409);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await app.inject({
                method: 'POST',
                url: '/api/auth/register',

                payload: {
                    email: 'john@example.com',
                    password: 'Password123',
                    displayName: 'John',
                },
            });
        });

        it('should login successfully', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/login',

                payload: {
                    email: 'john@example.com',
                    password: 'Password123',
                },
            });

            expect(response.statusCode).toBe(200);

            const body = response.json();

            expect(body.data.accessToken).toBeDefined();

            expect(body.data.refreshToken).toBeDefined();
        });

        it('should fail with invalid credentials', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/login',

                payload: {
                    email: 'john@example.com',
                    password: 'WrongPassword123',
                },
            });

            expect(response.statusCode).toBe(401);
        });

        it('should lock account after max failed attempts', async () => {
            for (let i = 0; i < 3; i++) {
                await app.inject({
                    method: 'POST',
                    url: '/api/auth/login',

                    payload: {
                        email: 'john@example.com',
                        password: 'WrongPassword123',
                    },
                });
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/login',

                payload: {
                    email: 'john@example.com',
                    password: 'Password123',
                },
            });

            expect(response.statusCode).toBe(423);
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should rotate refresh token', async () => {
            const registerResponse = await app.inject({
                method: 'POST',
                url: '/api/auth/register',

                payload: {
                    email: 'john@example.com',
                    password: 'Password123',
                    displayName: 'John',
                },
            });

            const oldRefreshToken =
                registerResponse.json().data.refreshToken;

            const response = await app.inject({
                method: 'POST',
                url: '/api/auth/refresh',

                payload: {
                    refreshToken: oldRefreshToken,
                },
            });

            expect(response.statusCode).toBe(200);

            const body = response.json();

            expect(body.data.accessToken).toBeDefined();

            expect(body.data.refreshToken).toBeDefined();

            //
            // old token revoked
            //
            const secondAttempt = await app.inject({
                method: 'POST',
                url: '/api/auth/refresh',

                payload: {
                    refreshToken: oldRefreshToken,
                },
            });

            expect(secondAttempt.statusCode).toBe(401);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should revoke refresh token', async () => {
            const registerResponse = await app.inject({
                method: 'POST',
                url: '/api/auth/register',

                payload: {
                    email: 'john@example.com',
                    password: 'Password123',
                    displayName: 'John',
                },
            });

            const refreshToken =
                registerResponse.json().data.refreshToken;

            const logoutResponse = await app.inject({
                method: 'POST',
                url: '/api/auth/logout',

                payload: {
                    refreshToken,
                },
            });

            expect(logoutResponse.statusCode).toBe(204);

            const refreshResponse = await app.inject({
                method: 'POST',
                url: '/api/auth/refresh',

                payload: {
                    refreshToken,
                },
            });

            expect(refreshResponse.statusCode).toBe(401);
        });
    });
});