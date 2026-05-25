import {FastifyInstance} from 'fastify';
import {Static, Type} from '@sinclair/typebox';
import {AuthService} from '../services/AuthService';
import {AuthValidator} from '../validators/authValidator';
import {RegisterBody, LoginBody, RefreshBody, LogoutBody} from '../types/auth';

const authService = new AuthService();

export default async function authRoutes(fastify: FastifyInstance) {
    // Register
    fastify.post<{ Body: Static<typeof RegisterBody> }>(
        '/register',
        {schema: {body: RegisterBody}},
        async (request, reply) => {
            const body = request.body as Static<typeof RegisterBody>;
            AuthValidator.validateRegisterBody(body);
            const result = await authService.register(body.email, body.password, body.displayName);
            return reply.status(201).send(result);
        }
    );

    // Login
    fastify.post<{ Body: Static<typeof LoginBody> }>(
        '/login',
        {schema: {body: LoginBody}},
        async (request, reply) => {
            const body = request.body as Static<typeof LoginBody>;
            AuthValidator.validateLoginBody(body);
            const result = await authService.login(body.email, body.password);
            return reply.send(result);
        }
    );

    // Refresh
    fastify.post<{ Body: Static<typeof RefreshBody> }>(
        '/refresh',
        {schema: {body: RefreshBody}},
        async (request, reply) => {
            const body = request.body as Static<typeof RefreshBody>;
            AuthValidator.validateRefreshBody(body);
            const result = await authService.refresh(body.refreshToken);
            return reply.send(result);
        }
    );

    // Logout
    fastify.post<{ Body: Static<typeof LogoutBody> }>(
        '/logout',
        { schema: { body: LogoutBody } },
        async (request, reply) => {
            const body = request.body as Static<typeof LogoutBody>;
            AuthValidator.validateLogoutBody(body);
            await authService.logout(body.refreshToken);
            return reply.status(204).send();
        },
    );
}
