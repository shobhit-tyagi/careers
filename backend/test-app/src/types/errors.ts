export class ValidationError extends Error {
    constructor(public errors: { field: string; message: string }[]) {
        super('Validation failed');
        this.name = 'ValidationError';
    }
}

export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(404, message, 'NOT_FOUND');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(401, message, 'UNAUTHORIZED');
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(409, message, 'CONFLICT');
    }
}