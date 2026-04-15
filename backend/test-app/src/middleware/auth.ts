import { FastifyRequest, FastifyReply } from 'fastify';

// TODO: Implement JWT verification and auth guard
// See README for expected implementation details

export const authGuard = async (request: FastifyRequest, reply: FastifyReply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return reply.code(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Missing authentication token' },
    });
  }

  // TODO: Verify the JWT access token
  // TODO: Attach decoded user payload to request.user
  // TODO: Handle expired or invalid tokens
};
