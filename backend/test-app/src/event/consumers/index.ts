import { startRewardConsumer, stopRewardConsumer } from './rewardConsumer';
import { startChallengeConsumer, stopChallengeConsumer } from './challengeConsumer';

export function startConsumers() {
    startChallengeConsumer();
    startRewardConsumer();

    console.log('[Consumers] started');
}

export async function stopConsumers() {
    await stopChallengeConsumer();
    await stopRewardConsumer();

    console.log('[Consumers] stopped');
}