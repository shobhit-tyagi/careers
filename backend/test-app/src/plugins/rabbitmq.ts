import amqp, { Channel, Connection } from 'amqplib';
import {config} from "../config";

export const EXCHANGE = 'fan_rewards_events';

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function initRabbitMQ() {
    if (connection && channel) return;

    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, 'topic', {
        durable: true,
    });
    console.log('[RabbitMQ] connected');
}

export async function checkRabbitMQ(): Promise<boolean> {
    try {
        if (!channel) return false;
        await channel.checkExchange(EXCHANGE);
        return true;
    } catch {
        return false;
    }
}

export function getChannel(): Channel {
    if (!channel) {
        throw new Error('RabbitMQ not initialized');
    }
    return channel;
}