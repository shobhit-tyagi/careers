import type { FastifyInstance } from 'fastify';

type ShutdownDeps = {
    redis?: any;
    rabbitmq?: {
        close: () => Promise<void>;
    };
    dataSource?: {
        destroy: () => Promise<void>;
    };
    stopConsumers?: () => Promise<void>;
    stopScheduler?: () => Promise<void>;
};

let shuttingDown = false;

export const registerGracefulShutdown = (
    app: FastifyInstance,
    deps: ShutdownDeps
) => {
    const shutdown = async (signal: string) => {
        if (shuttingDown) return;
        shuttingDown = true;

        app.log.info({ signal }, 'shutdown initiated');

        try {
            await app.close();
            await deps.stopScheduler?.();
            await deps.stopConsumers?.();
            await deps.rabbitmq?.close();
            if (deps.redis?.quit) {
                await deps.redis.quit();
            }

            if (deps.dataSource?.destroy) {
                await deps.dataSource.destroy();
            }

            app.log.info('shutdown complete');
            process.exit(0);
        } catch (err) {
            app.log.error(err, 'shutdown failed');
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};