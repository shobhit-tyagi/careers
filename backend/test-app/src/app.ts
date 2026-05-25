import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { v4 as uuidv4 } from 'uuid';

import { config } from './config';
import { dbPlugin } from './plugins/db';
import { initRabbitMQ } from './plugins/rabbitmq';
import { initRedis } from './plugins/redis';

import { setupErrorHandler } from './hooks/errorHandler';

import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import challengeRoutes from './routes/challenge';
import leaderboardRoutes from './routes/leaderboard';
import rewardRoutes from './routes/reward';
import { healthRoutes } from './routes/health';

import { authMiddleware } from './middleware/auth';

import { startConsumers } from './event/consumers';
import {
  startLeaderboardScheduler,
} from './jobs/scheduler';

export const buildApp = async () => {
  const app = Fastify({
    logger: {
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

  app.addHook('onRequest', async (req, reply) => {
    reply.header('x-correlation-id', req.id);
  });

  await app.register(helmet);
  await app.register(dbPlugin);

  const rabbitmq = await initRabbitMQ();
  const redis = await initRedis();

  await app.register(rateLimit, {
    redis,
    global: false,
  });

  startConsumers();
  startLeaderboardScheduler();

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

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });

  await app.register(async (app) => {
    app.addHook('preHandler', authMiddleware);
    app.register(userRoutes, { prefix: '/api/user' });
  });

  await app.register(async (app) => {
    app.addHook('preHandler', authMiddleware);
    app.register(challengeRoutes, { prefix: '/api/challenges' });
  });

  await app.register(async (app) => {
    app.addHook('preHandler', authMiddleware);
    app.register(rewardRoutes, { prefix: '/api/rewards' });
  });

  await app.register(async (app) => {
    app.addHook('preHandler', authMiddleware);
    app.register(leaderboardRoutes, { prefix: '/api/leaderboard' });
  });

  await app.register(async (app) => {
    app.register(healthRoutes, { prefix: '/health' });
  });

  return {
    app,
    redis,
    rabbitmq,
  };
};