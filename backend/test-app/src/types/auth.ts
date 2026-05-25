import { Type } from '@sinclair/typebox';

export const RegisterBody = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8 }),
    displayName: Type.String({ minLength: 2, maxLength: 100 }),
});

export const LoginBody = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8 }),
});

export const RefreshBody = Type.Object({
    refreshToken: Type.String({ minLength: 1 }),
});

export const LogoutBody = Type.Object({
    refreshToken: Type.String({ minLength: 1 }),
});