import {DataSource} from 'typeorm';
import {config} from '../config';
import {User} from "../entities/User";
import {RefreshToken} from "../entities/RefreshToken";
import {RewardRedemption} from "../entities/RewardRedemption";
import {Reward} from "../entities/Reward";
import {ChallengeCompletion} from "../entities/ChallengeCompletion";
import {Challenge} from "../entities/Challenge";

const dataSource = new DataSource({
    type: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.username,
    password: config.db.password,
    database: config.db.database,
    entities: [
        User,
        RefreshToken,
        Challenge,
        ChallengeCompletion,
        Reward,
        RewardRedemption,
    ],
    migrations: [
        'src/migrations/*.ts'
    ],
    synchronize: false, // Use migrations instead
    logging: false,
});

// Fastify plugin to initialize database
export const dbPlugin = async (fastify: any) => {
    if (!dataSource.isInitialized) {
        await dataSource.initialize();
    }
    fastify.decorate('db', dataSource);
};

export {dataSource};
