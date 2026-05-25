import {LeaderboardBuilderService} from "../../services/LeaderboardBuilderService";
import {EXCHANGE, getChannel} from "../../plugins/rabbitmq";

type ChallengeCompletedEvent = {
    userId: string;
    challengeId: string;
    pointsEarned: number;
    listenDurationPercent: number;
    timestamp: string;
};

const builder = new LeaderboardBuilderService();

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

            await builder.applyPointsChange({
                userId: event.userId,
                delta: event.pointsEarned,
            });

            channel.ack(msg);
        } catch (err) {
            console.error('challenge consumer failed', err);
            channel.nack(msg, false, true);
        }
    });
}