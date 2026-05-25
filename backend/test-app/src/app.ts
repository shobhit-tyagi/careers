import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config';
import {dbPlugin} from "./plugins/db";
import {setupErrorHandler} from "./hooks/errorHandler";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import {authMiddleware} from "./middleware/auth";
import challengeRoutes from "./routes/challenge";
import leaderboardRoutes from "./routes/leaderboard";
import rewardRoutes from "./routes/reward";
import {healthRoutes} from "./routes/health";
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {initRabbitMQ} from "./plugins/rabbitmq";
import {initRedis} from "./plugins/redis";
import {startConsumers} from "./event/consumers";
import {startLeaderboardScheduler} from "./jobs/scheduler";
import { v4 as uuidv4 } from 'uuid';

const buildApp = async () => {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
      },
    },
    genReqId: (req) => {
      const incoming = req.headers['x-correlation-id'];
      if (typeof incoming === 'string') {
        return incoming;
      }
      return uuidv4();
    },
  });
  app.addHook('onRequest', async (req, reply) => {
    reply.header('x-correlation-id', req.id);
  });

  // Register plugins
  await app.register(cors, { origin: true });
  await app.register(helmet);
  await app.register(dbPlugin);
  await initRabbitMQ();
  await initRedis();
  startConsumers();
  startLeaderboardScheduler();
  setupErrorHandler(app);

  // Swagger
  app.register(swagger, {
    openapi: {
      info: {
        title: 'FanRewards API',
        description: 'API documentation',
        version: '1.0.0',
      },
    },
  });

  app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(async function (app) {
    app.addHook('preHandler', authMiddleware);
    app.register(userRoutes, { prefix: '/api/user' });
  });
  await app.register(async function (app) {
    app.addHook('preHandler', authMiddleware);
    app.register(challengeRoutes, { prefix: '/api/challenges' });
  });
  await app.register(async function (app) {
    app.addHook('preHandler', authMiddleware);
    app.register(rewardRoutes, { prefix: '/api/rewards' });
  });
  await app.register(async function (app) {
    app.addHook('preHandler', authMiddleware);
    app.register(leaderboardRoutes, { prefix: '/api/leaderboard' });
  });

  // Health check
  await app.register(async function (app) {
    app.register(healthRoutes, { prefix: '/health' });
  })

  return app;
};

const start = async () => {
  const app = await buildApp();

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

export { buildApp };
