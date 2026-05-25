import { ValidationError } from '../types/errors';

export class UserValidator {
    static validateDisplayName(displayName: string) {
        const trimmed = displayName.trim();
        if (trimmed.length < 2) {
            throw new ValidationError([
                { field: 'displayName', message: 'Too short' },
            ]);
        }

        if (trimmed.length > 100) {
            throw new ValidationError([
                { field: 'displayName', message: 'Too long' },
            ]);
        }

        return trimmed;
    }

    static validateUpdateProfile(payload: {
        displayName?: string;
    }) {
        const errors: { field: string; message: string }[] = [];
        if (payload.displayName !== undefined) {
            try {
                this.validateDisplayName(payload.displayName);
            } catch (e) {
                if (e instanceof ValidationError) {
                    errors.push(...e.errors);
                }
            }
        }
        if (errors.length > 0) {
            throw new ValidationError(errors);
        }
    }
}