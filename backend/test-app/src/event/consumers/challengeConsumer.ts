import {EXCHANGE, getChannel} from "../../plugins/rabbitmq";

type ChallengeCompletedEvent = {
    userId: string;
    challengeId: string;
    pointsEarned: number;
    listenDurationPercent: number;
    timestamp: string;
};

export function startChallengeConsumer() {
    const channel = getChannel();

    channel.assertQueue('leaderboard.queue', { durable: true });
    channel.bindQueue('leaderboard.queue', EXCHANGE, 'challenge.completed');

    channel.consume('leaderboard.queue', async (msg) => {
        if (!msg) return;

        try {
            const event: ChallengeCompletedEvent = JSON.parse(
                msg.content.toString(),
            );

            console.log("Consumed event: ", event);
            channel.ack(msg);
        } catch (err) {
            console.error('challenge consumer failed', err);
            channel.nack(msg, false, true);
        }
    });
}