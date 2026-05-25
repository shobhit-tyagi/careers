import {startRewardConsumer} from "./rewardConsumer";
import {startChallengeConsumer} from "./challengeConsumer";

export function startConsumers() {
    startChallengeConsumer();
    startRewardConsumer();

    console.log('[Consumers] started');
}