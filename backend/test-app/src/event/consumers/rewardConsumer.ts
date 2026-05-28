import { EXCHANGE } from '../../plugins/rabbitmq';
import {Channel} from "amqplib";

type RewardRedeemedEvent = {
    userId: string;
    rewardId: string;
    redemptionId: string;
    pointsSpent: number;
    timestamp: string;
};

export async function startRewardConsumer(channel: Channel) {
    await channel.assertQueue('reward.queue', { durable: true });
    await channel.bindQueue('reward.queue', EXCHANGE, 'reward.redeemed');

    const res = await channel.consume('reward.queue', async (msg) => {
        if (!msg) return;

        try {
            const event = JSON.parse(msg.content.toString());
            console.log('Consumed event:', event);

            channel.ack(msg);
        } catch (err) {
            console.error('reward consumer failed', err);
            channel.nack(msg, false, true);
        }
    });

    return res.consumerTag;
}