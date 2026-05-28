import {buildApp} from '../../src/app';
import {
    createTestContext,
    destroyTestContext,
    TestContext,
} from '../setup/containers';
import * as amqp from "amqplib";
import {Channel, Connection} from "amqplib";
import {EXCHANGE} from "../../src/plugins/rabbitmq";

describe('Health Route', () => {
    let ctx: TestContext;
    let app: any;
    let connection: Connection;
    let appChannel: Channel;
    let testChannel: Channel;

    beforeAll(async () => {
        ctx = await createTestContext();
        connection = await amqp.connect(ctx.rabbitmqUrl);

        appChannel = await connection.createChannel();
        testChannel = await connection.createChannel();

        await testChannel.assertExchange(EXCHANGE, 'topic', {
            durable: true,
        });
        app = await buildApp({
                dataSource: ctx.dataSource,
                redis: ctx.redis,
                rabbitmq: {
                    channel: appChannel,
                    close: async () => {},
                }
            },
            {
                disableRateLimit: true,
                disablePinoPrettyLogger: true,
                disableConsumers: true,
            });

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


    test('returns 200 when all services are healthy', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/health',
        });

        const body = JSON.parse(res.payload);

        expect(res.statusCode).toBe(200);
        expect(body.data.status).toBe('ok');
        expect(body.data.services.db).toBe(true);
        expect(body.data.services.redis).toBe(true);
        expect(body.data.services.rabbitmq).toBe(true);
    });
});