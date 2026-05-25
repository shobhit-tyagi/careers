import Redis from 'ioredis';

let redis: Redis | null = null;

export async function initRedis() {
    if (redis) return redis;

    redis = new Redis(process.env.REDIS_URL!);

    redis.on('connect', () => {
        console.log('[Redis] connected');
    });

    redis.on('error', (err) => {
        console.error('[Redis] error', err);
    });

    return redis;
}

export function getRedis(): Redis {
    if (!redis) {
        throw new Error('Redis not initialized. Call initRedis() first.');
    }
    return redis;
}