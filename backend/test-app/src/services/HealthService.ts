import { dataSource } from '../plugins/db';
import { checkRabbitMQ } from '../plugins/rabbitmq';

export class HealthService {
    async check() {
        const dbOk = dataSource.isInitialized;

        const rabbitOk = await checkRabbitMQ();

        const ok = dbOk && rabbitOk;

        return {
            data: {
                status: ok ? 'ok' : 'degraded',
                services: {
                    db: dbOk,
                    rabbitmq: rabbitOk,
                },
            },
        };
    }
}