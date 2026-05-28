import { FastifyInstance } from 'fastify';
import { DataSource } from 'typeorm';
import { User } from '../../src/entities/User';

export type CreatedUser = {
    token: any;
    userId: string;
    email: string;
}

export async function createUserAndLogin(
    app: FastifyInstance,
    dataSource: DataSource,
    overrideEmail?: string,
    overrideDisplayName?: string
) {
    const email = overrideEmail || "user@test.com";
    const displayName = overrideDisplayName || "User";

    await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
            email,
            password: 'Password123',
            displayName: displayName,
        },
    });

    const loginRes = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
            email,
            password: 'Password123',
        },
    });

    const body = loginRes.json();

    const user = await dataSource.getRepository(User).findOne({
        where: { email },
    });

    return {
        token: body.data.accessToken,
        userId: user!.id,
        email,
    };
}