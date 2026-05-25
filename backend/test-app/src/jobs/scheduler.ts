import cron from 'node-cron';
import { rebuildLeaderboardJob } from './leaderboardJob';
import {config} from "../config";

export function startLeaderboardScheduler() {
    const cronExp = config.scheduler.leaderboardJob ?? '*/30 * * * * *';

    rebuildLeaderboardJob().catch((err) => {
        console.error('[leaderboard-job] initial run failed', err);
    });

    cron.schedule(cronExp, async () => {
        try {
            await rebuildLeaderboardJob();
        } catch (e) {
            console.error('[leaderboard-job] failed', e);
        }
    });
}