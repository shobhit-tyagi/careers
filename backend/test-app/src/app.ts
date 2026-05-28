import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { v4 as uuidv4 } from 'uuid';

import { config } from './config';

import { setupErrorHandler } from './hooks/errorHandler';

import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import challengeRoutes from './routes/challenge';
import leaderboardRoutes from './routes/leaderboard';
import rewardRoutes from './routes/reward';
import { healthRoutes } from './routes/health';

import { authMiddleware } from './middleware/auth';

import {AuthService} from "./services/authService";
import {UserService} from "./services/userService";
import {LeaderboardService} from "./services/leaderboardService";
import {RewardService} from "./services/rewardService";
import {ChallengeService} from "./services/challengeService";

import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import {RabbitMQClient} from "./plugins/rabbitmq";
import {HealthService} from "./services/healthService";
import {startLeaderboardScheduler} from "./jobs/scheduler";
import {dataSource} from "./plugins/db";
import {startConsumers} from "./event/consumers";

export type AppDependencies = {
  dataSource: DataSource;
  redis: Redis;
  rabbitmq: RabbitMQClient;
};

export type AppOptions = {
  disableRateLimit?: boolean;
  disablePinoPrettyLogger?: boolean;
  disableAuth?: boolean;
  disableConsumers?: boolean;
};

export const buildApp = async (
    deps: AppDependencies, opts: AppOptions
) => {
  const dataSource = deps.dataSource
  const redis = deps.redis
  const rabbitmq = deps.rabbitmq

  const app = Fastify({
    logger: opts.disablePinoPrettyLogger
        ? false
        : {
          transport: { target: 'pino-pretty' },
        },
    genReqId: (req) => {
      const incoming = req.headers['x-correlation-id'];
      return typeof incoming === 'string' ? incoming : uuidv4();
    },
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      const allowed = config.cors.origins;

      if (allowed.includes(origin)) {
        return cb(null, true);
      }

      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "http://localhost:3000"],
      }
    }
  });

  app.addHook('onRequest', async (req, reply) => {
    reply.header('x-correlation-id', req.id);
  });

  await app.register(helmet);
  if (!opts.disableRateLimit) {
    await app.register(rateLimit, {
      redis,
      global: false,
    });
  }

  setupErrorHandler(app);
  app.register(swagger, {
    openapi: {
      info: {
        title: 'FanRewards API',
        version: '1.0.0',
      },
    },
  });

  app.register(swaggerUi, { routePrefix: '/docs' });

  const authService = new AuthService(dataSource);
  const userService = new UserService(dataSource);
  const challengeService = new ChallengeService(dataSource, rabbitmq);
  const rewardService = new RewardService(dataSource, rabbitmq);
  const leaderboardService = new LeaderboardService(redis);
  const healthService = new HealthService(dataSource, rabbitmq, redis);

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth', authService });

  await app.register(async (app) => {
    app.addHook('preHandler', authMiddleware);
    app.register(userRoutes, { prefix: '/api/user', userService });
  });

  await app.register(async (app) => {
    app.addHook('preHandler', authMiddleware);
    app.register(challengeRoutes, { prefix: '/api/challenges', challengeService });
  });

  await app.register(async (app) => {
    app.addHook('preHandler', authMiddleware);
    app.register(rewardRoutes, { prefix: '/api/rewards', rewardService });
  });

  await app.register(async (app) => {
    app.addHook('preHandler', authMiddleware);
    app.register(leaderboardRoutes, { prefix: '/api/leaderboard', leaderboardService });
  });

  await app.register(async (app) => {
    app.register(healthRoutes, { prefix: '/health', healthService });
  });

  if (!opts.disableConsumers) {
    await startConsumers(rabbitmq.channel);
  }

  return app;
};