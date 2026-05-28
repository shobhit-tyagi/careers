import { buildApp } from './app';
import {startConsumers, stopConsumers} from './event/consumers';
import {startLeaderboardScheduler, stopLeaderboardScheduler} from './jobs/scheduler';
import {initRabbitMQ} from "./plugins/rabbitmq";
import {initRedis} from "./plugins/redis";
import {dataSource} from "./plugins/db";

const start = async () => {
    await dataSource.initialize();
    const redis = await initRedis();
    const rabbitmq = await initRabbitMQ();

    const app = await buildApp({dataSource, rabbitmq, redis}, {});

    startLeaderboardScheduler(dataSource, redis);

    let shuttingDown = false;
    const shutdown = async (signal: string) => {
        if (shuttingDown) return;
        shuttingDown = true;

        console.log(`[shutdown] ${signal}`);

        try {
            stopLeaderboardScheduler();
            await stopConsumers(rabbitmq.channel);
            await rabbitmq.close?.();
            await app.close();
            await redis.quit?.();
            process.exit(0);
        } catch (err) {
            console.error('[shutdown error]', err);
            process.exit(1);
        }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('server started');
};

start();