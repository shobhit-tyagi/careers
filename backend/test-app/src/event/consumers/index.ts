import { startRewardConsumer } from './rewardConsumer';
import { startChallengeConsumer } from './challengeConsumer';
import {Channel} from "amqplib";

let challengeTag: string | null = null;
let rewardTag: string | null = null;

export async function startConsumers(channel: Channel) {
    challengeTag = await startChallengeConsumer(channel);
    rewardTag = await startRewardConsumer(channel);

    console.log('[Consumers] started');
}

export async function stopConsumers(channel: Channel) {

    if (challengeTag) await channel.cancel(challengeTag);
    if (rewardTag) await channel.cancel(rewardTag);

    challengeTag = null;
    rewardTag = null;

}