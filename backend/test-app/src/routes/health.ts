import { FastifyInstance } from 'fastify';
import { HealthService } from '../services/healthService';
import {HealthResponseBody} from "../types/health";

export async function healthRoutes(fastify: FastifyInstance,
                                   opts: { healthService: HealthService }) {
    fastify.get('', {
        schema: {
            response: {
                200: HealthResponseBody,
            },
        },
    }, async (req, reply) => {
        const result = await opts.healthService.check();

        if (result.data.status !== 'ok') {
            return reply.code(503).send(result);
        }

        return result;
    });
}