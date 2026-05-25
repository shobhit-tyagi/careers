import {EXCHANGE, getChannel} from "../../plugins/rabbitmq";

type RewardRedeemedEvent = {
    userId: string;
    rewardId: string;
    redemptionId: string;
    pointsSpent: number;
    timestamp: string;
};

export function startRewardConsumer() {
    const channel = getChannel();

    channel.assertQueue('reward.queue', { durable: true });
    channel.bindQueue('reward.queue', EXCHANGE, 'reward.redeemed');

    channel.consume('reward.queue', async (msg) => {
        if (!msg) return;

        try {
            const event: RewardRedeemedEvent = JSON.parse(msg.content.toString());
            console.log("Consumed event: ", event);
            channel.ack(msg);
        } catch (err) {
            console.error('reward consumer failed', err);
            channel.nack(msg, false, true);
        }
    });
}