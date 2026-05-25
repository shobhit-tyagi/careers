import { FastifyInstance } from 'fastify';
import { HealthService } from '../services/HealthService';
import {HealthResponseBody} from "../types/health";

export async function healthRoutes(fastify: FastifyInstance) {
    const service = new HealthService();

    fastify.get('', {
        schema: {
            response: {
                200: HealthResponseBody,
            },
        },
    }, async (req, reply) => {
        const result = await service.check();

        if (result.data.status !== 'ok') {
            return reply.code(503).send(result);
        }

        return result;
    });
}