import {ValidationError} from '../types/errors';
import {LoginBody, LogoutBody, RefreshBody, RegisterBody} from '../types/auth';
import {Static} from "@sinclair/typebox";

export class AuthValidator {
    static validateEmail(email: string): string {
        if (!email) {
            throw new ValidationError([
                {field: 'email', message: 'Email is required and must be a string'}
            ]);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ValidationError([
                {field: 'email', message: 'Email format is invalid'}
            ]);
        }

        return email.toLowerCase();
    }

    static validatePassword(password: string): string {
        if (!password) {
            throw new ValidationError([
                {field: 'password', message: 'Password is required and must be a string'}
            ]);
        }

        if (password.length < 8) {
            throw new ValidationError([
                {field: 'password', message: 'Password must be at least 8 characters'}
            ]);
        }

        if (password.length > 128) {
            throw new ValidationError([
                {field: 'password', message: 'Password must not exceed 128 characters'}
            ]);
        }

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            throw new ValidationError([
                {
                    field: 'password',
                    message: 'Password must contain uppercase, lowercase, and numbers'
                }
            ]);
        }

        return password;
    }

    static validateDisplayName(displayName: string): string {
        if (!displayName) {
            throw new ValidationError([
                {field: 'displayName', message: 'Display name is required and must be a string'}
            ]);
        }

        if (displayName.trim().length === 0) {
            throw new ValidationError([
                {field: 'displayName', message: 'Display name cannot be empty'}
            ]);
        }

        if (displayName.length < 2) {
            throw new ValidationError([
                {field: 'displayName', message: 'Display name must be at least 2 characters'}
            ]);
        }

        if (displayName.length > 100) {
            throw new ValidationError([
                {field: 'displayName', message: 'Display name must not exceed 100 characters'}
            ]);
        }

        return displayName.trim();
    }

    static validateRegisterBody(payload: Static<typeof RegisterBody>) {
        const errors: { field: string; message: string }[] = [];

        try {
            this.validateEmail(payload.email);
        } catch (e) {
            if (e instanceof ValidationError) {
                errors.push(...e.errors);
            }
        }

        try {
            this.validatePassword(payload.password);
        } catch (e) {
            if (e instanceof ValidationError) {
                errors.push(...e.errors);
            }
        }

        try {
            this.validateDisplayName(payload.displayName);
        } catch (e) {
            if (e instanceof ValidationError) {
                errors.push(...e.errors);
            }
        }

        if (errors.length > 0) {
            throw new ValidationError(errors);
        }
    }

    static validateLoginBody(payload: Static<typeof LoginBody>) {
        const errors: { field: string; message: string }[] = [];

        try {
            this.validateEmail(payload.email);
        } catch (e) {
            if (e instanceof ValidationError) errors.push(...e.errors);
        }
        try {
            this.validatePassword(payload.password);
        } catch (e) {
            if (e instanceof ValidationError) errors.push(...e.errors);
        }

        if (errors.length > 0) throw new ValidationError(errors);
    }

    static validateRefreshBody(payload: Static<typeof RefreshBody>) {
        if (!payload.refreshToken) {
            throw new ValidationError([
                { field: 'refreshToken', message: 'Refresh token is required and must be a string' }
            ]);
        }

        if (payload.refreshToken.trim().length === 0) {
            throw new ValidationError([
                { field: 'refreshToken', message: 'Refresh token cannot be empty' }
            ]);
        }
    }

    static validateLogoutBody(payload: Static<typeof LogoutBody>) {
        if (!payload.refreshToken) {
            throw new ValidationError([
                { field: 'refreshToken', message: 'Refresh token is required and must be a string' }
            ]);
        }

        if (payload.refreshToken.trim().length === 0) {
            throw new ValidationError([
                { field: 'refreshToken', message: 'Refresh token cannot be empty' }
            ]);
        }
    }
}