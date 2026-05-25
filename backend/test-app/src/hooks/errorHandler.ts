// src/hooks/errorHandler.ts
import { FastifyInstance } from 'fastify';
import { ValidationError, AppError } from '../types/errors';

export const setupErrorHandler = (app: FastifyInstance) => {
    app.setErrorHandler((error, request, reply) => {
        const requestId = request.id;

        // ValidationError (custom)
        if (isValidationError(error)) {
            request.log.warn(
                { requestId, error: error.errors },
                'Validation failed',
            );

            return reply.status(400).send({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: error.errors,
                },
            });
        }

        // AppError (safe via shape, NOT instanceof)
        if (
            typeof error === 'object' &&
            error !== null &&
            (error as any).statusCode
        ) {
            const appError = error as AppError;

            const statusCode = appError.statusCode;

            request.log.warn(
                { requestId, error: appError.message },
                appError.name,
            );

            return reply.status(statusCode).send({
                error: {
                    code: appError.code ?? 'APP_ERROR',
                    message: appError.message,
                },
            });
        }

        // Fastify validation errors
        if ((error as any).statusCode === 400) {
            request.log.warn(
                { requestId, error: error.message },
                'Bad Request',
            );

            return reply.status(400).send({
                error: {
                    code: 'BAD_REQUEST',
                    message: error.message,
                },
            });
        }

        request.log.error(
            { requestId, error },
            'Internal Server Error',
        );

        return reply.status(500).send({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
                requestId,
            },
        });
    });
};

function isValidationError(error: unknown): error is ValidationError {
    return (
        typeof error === 'object' &&
        error !== null &&
        (error as any).name === 'ValidationError' &&
        Array.isArray((error as any).errors)
    );
}