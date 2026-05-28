import {checkRabbitMQ, RabbitMQClient} from '../plugins/rabbitmq';
import {DataSource} from "typeorm";
import Redis from "ioredis";
import {checkRedis} from "../plugins/redis";

export class HealthService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly rabbitmq: RabbitMQClient,
        private readonly redis: Redis
    ) {}
    async check() {
        const dbOk = this.dataSource.isInitialized;
        const rabbitOk = await checkRabbitMQ(this.rabbitmq);
        const redisOk = await checkRedis(this.redis);

        const ok = dbOk && rabbitOk && redisOk;

        return {
            data: {
                status: ok ? 'ok' : 'degraded',
                services: {
                    db: dbOk,
                    rabbitmq: rabbitOk,
                    redis: redisOk,
                },
            },
        };
    }
}