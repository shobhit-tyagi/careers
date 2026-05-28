import { EXCHANGE } from '../../plugins/rabbitmq';
import {Channel} from "amqplib";

type ChallengeCompletedEvent = {
    userId: string;
    challengeId: string;
    pointsEarned: number;
    listenDurationPercent: number;
    timestamp: string;
};

export async function startChallengeConsumer(channel: Channel) {
    await channel.assertQueue('leaderboard.queue', { durable: true });
    await channel.bindQueue('leaderboard.queue', EXCHANGE, 'challenge.completed');

    const res = await channel.consume('leaderboard.queue', async (msg) => {
        if (!msg) return;

        try {
            const event = JSON.parse(msg.content.toString());
            console.log('Consumed event:', event);

            channel.ack(msg);
        } catch (err) {
            console.error('challenge consumer failed', err);
            channel.nack(msg, false, true);
        }
    });

    return res.consumerTag;
}