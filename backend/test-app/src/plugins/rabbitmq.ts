import amqp, { Channel, Connection } from 'amqplib';
import { config } from '../config';

export const EXCHANGE = 'fan_rewards_events';

export type RabbitMQClient = {
    channel: Channel;
    close: () => Promise<void>;
};

export async function initRabbitMQ(): Promise<RabbitMQClient> {
    const connection = await amqp.connect(config.rabbitmq.url);
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    return {
        channel,
        close: async () => {
            await channel.close();
            await connection.close();
        }
    };
}

export async function checkRabbitMQ(client: RabbitMQClient): Promise<boolean> {
    try {
        await client.channel.checkExchange(EXCHANGE);
        return true;
    } catch {
        return false;
    }
}