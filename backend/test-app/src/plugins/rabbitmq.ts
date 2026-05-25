import amqp, { Channel, Connection } from 'amqplib';
import { config } from '../config';

export const EXCHANGE = 'fan_rewards_events';

let connection: Connection | null = null;
let channel: Channel | null = null;

export type RabbitMQClient = {
    channel: Channel;
    close: () => Promise<void>;
};

export async function initRabbitMQ(): Promise<RabbitMQClient> {
    if (connection && channel) {
        return {
            channel: channel!,
            close,
        };
    }

    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE, 'topic', {
        durable: true,
    });
    console.log('[RabbitMQ] connected');
    return {
        channel,
        close,
    };
}

export function getChannel(): Channel {
    if (!channel) {
        throw new Error('RabbitMQ not initialized');
    }
    return channel;
}

export async function close(): Promise<void> {
    try {
        if (channel) {
            await channel.close();
            channel = null;
        }
        if (connection) {
            await connection.close();
            connection = null;
        }
        console.log('[RabbitMQ] closed');
    } catch (err) {
        console.error('[RabbitMQ] close error', err);
    }
}