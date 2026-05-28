import { ValidationError } from '../types/errors';

export class UserValidator {
    static validateDisplayName(displayName: unknown) {
        const errors: { field: string; message: string }[] = [];

        if (typeof displayName !== 'string') {
            throw new ValidationError([
                { field: 'displayName', message: 'Must be a string' },
            ]);
        }

        const trimmed = displayName.trim();

        if (trimmed.length < 2) {
            errors.push({ field: 'displayName', message: 'Too short' });
        }

        if (trimmed.length > 100) {
            errors.push({ field: 'displayName', message: 'Too long' });
        }

        if (errors.length) {
            throw new ValidationError(errors);
        }

        return trimmed;
    }

    static validateUpdateProfile(payload: { displayName?: unknown }) {
        if (payload.displayName !== undefined) {
            this.validateDisplayName(payload.displayName);
        }
    }
}