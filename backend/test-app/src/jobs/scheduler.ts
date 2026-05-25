import cron, { ScheduledTask } from 'node-cron';
import { rebuildLeaderboardJob } from './leaderboardJob';
import { config } from '../config';

let task: ScheduledTask | null = null;

export function startLeaderboardScheduler() {
    const cronExp = config.scheduler.leaderboardJob ?? '*/30 * * * * *';
    // initial run
    rebuildLeaderboardJob().catch((err) => {
        console.error('[leaderboard-job] initial run failed', err);
    });
    task = cron.schedule(cronExp, async () => {
        try {
            await rebuildLeaderboardJob();
        } catch (e) {
            console.error('[leaderboard-job] failed', e);
        }
    });
    console.log('[Scheduler] started');
}

export function stopLeaderboardScheduler() {
    if (task) {
        task.stop();
        task.destroy();
        task = null;
        console.log('[Scheduler] stopped');
    }
}