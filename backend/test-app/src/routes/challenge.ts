import {FastifyInstance} from 'fastify';
import {Static} from '@sinclair/typebox';
import {ChallengeService} from '../services/challengeService';
import {ChallengeValidator} from '../validators/challengeValidator';
import {CompleteChallengeBody} from '../types/challenge';
import {AuthService} from "../services/authService";

export default async function challengeRoutes(
    fastify: FastifyInstance,
    opts: { challengeService: ChallengeService }
) {
    // Challenges
    fastify.get('', async (request, reply) => {
        const query = request.query as {
            page?: number;
            limit?: number;
            difficulty?: string;
            active?: string;
        };

        ChallengeValidator.validateListQuery(query);

        const result = await opts.challengeService.listChallenges(query);
        return reply.send(result);
    });

    // Challenge by ID
    fastify.get('/:id', async (request, reply) => {
        const {id} = request.params as { id: string };

        ChallengeValidator.validateId(id);

        const challenge = await opts.challengeService.getChallengeById(id);
        return reply.send(challenge);
    });

    // Complete a challenge
    fastify.post<{ Body: Static<typeof CompleteChallengeBody> }>(
        '/:id/complete',
        async (request, reply) => {
            const userId = request.user!.userId;
            const {id} = request.params as { id: string };
            const body = request.body as Static<typeof CompleteChallengeBody>;

            ChallengeValidator.validateId(id);
            ChallengeValidator.validateCompleteBody(body);

            const result = await opts.challengeService.completeChallenge(
                userId,
                id,
                body,
            );

            return reply.send(result);
        },
    );
}