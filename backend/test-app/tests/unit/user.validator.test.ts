import { UserValidator } from '../../src/validators/userValidator';
import { ValidationError } from '../../src/types/errors';

describe('UserValidator', () => {

    describe('validateDisplayName', () => {

        it('should return trimmed valid display name', () => {
            const result = UserValidator.validateDisplayName('  John Doe  ');
            expect(result).toBe('John Doe');
        });

        it('should throw if not a string', () => {
            expect(() => {
                UserValidator.validateDisplayName(123 as any);
            }).toThrow(ValidationError);
        });

        it('should throw if too short', () => {
            expect(() => {
                UserValidator.validateDisplayName('A');
            }).toThrow(ValidationError);
        });

        it('should throw if too long', () => {
            const long = 'a'.repeat(101);
            expect(() => {
                UserValidator.validateDisplayName(long);
            }).toThrow(ValidationError);
        });

        it('should throw both validation errors when needed', () => {
            expect(() => {
                UserValidator.validateDisplayName('a');
            }).toThrow(ValidationError);
        });

    });

    // -------------------------
    // validateUpdateProfile
    // -------------------------
    describe('validateUpdateProfile', () => {

        it('should pass when displayName is undefined', () => {
            expect(() => {
                UserValidator.validateUpdateProfile({});
            }).not.toThrow();
        });

        it('should validate displayName when provided', () => {
            expect(() => {
                UserValidator.validateUpdateProfile({
                    displayName: 'Valid Name',
                });
            }).not.toThrow();
        });

        it('should throw when displayName is invalid type', () => {
            expect(() => {
                UserValidator.validateUpdateProfile({
                    displayName: 123 as any,
                });
            }).toThrow(ValidationError);
        });

        it('should throw when displayName is too short', () => {
            expect(() => {
                UserValidator.validateUpdateProfile({
                    displayName: 'a',
                });
            }).toThrow(ValidationError);
        });

        it('should throw when displayName is too long', () => {
            const long = 'a'.repeat(101);
            expect(() => {
                UserValidator.validateUpdateProfile({
                    displayName: long,
                });
            }).toThrow(ValidationError);
        });

    });

});