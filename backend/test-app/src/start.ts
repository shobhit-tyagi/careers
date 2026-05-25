import { buildApp } from './app';
import { stopConsumers } from './event/consumers';
import { stopLeaderboardScheduler } from './jobs/scheduler';

const start = async () => {
    const { app, redis, rabbitmq } = await buildApp();

    let shuttingDown = false;
    const shutdown = async (signal: string) => {
        if (shuttingDown) return;
        shuttingDown = true;

        console.log(`[shutdown] ${signal}`);

        try {
            await app.close();
            stopLeaderboardScheduler();
            await stopConsumers();
            await rabbitmq.close?.();
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