import cron, { ScheduledTask } from 'node-cron';
import { rebuildLeaderboardJob } from './leaderboardJob';
import { config } from '../config';
import {DataSource} from "typeorm";
import Redis from "ioredis";

let task: ScheduledTask | null = null;

export function startLeaderboardScheduler(dataSource: DataSource, redis: Redis) {
    const cronExp = config.scheduler.leaderboardJob ?? '*/30 * * * * *';
    // initial run
    console.log("Running leaderboard job for the first time")
    rebuildLeaderboardJob(dataSource, redis).catch((err) => {
        console.error('[leaderboard-job] initial run failed', err);
    });
    task = cron.schedule(cronExp, async () => {
        try {
            console.log("Running leaderboard job")
            await rebuildLeaderboardJob(dataSource, redis);
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