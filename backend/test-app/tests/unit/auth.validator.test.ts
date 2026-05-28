import {AuthValidator} from "../../src/validators/authValidator";
import {ValidationError} from "../../src/types/errors";

describe('AuthValidator', () => {

    describe('validateEmail', () => {
        it('should normalize valid email', () => {
            const result = AuthValidator.validateEmail('Test@Email.com');
            expect(result).toBe('test@email.com');
        });

        it('should throw if email is empty', () => {
            expect(() =>
                AuthValidator.validateEmail('')
            ).toThrow(ValidationError);
        });

        it('should throw if email format is invalid', () => {
            expect(() =>
                AuthValidator.validateEmail('invalid-email')
            ).toThrow(ValidationError);
        });
    });

    describe('validatePassword', () => {
        it('should accept valid password', () => {
            const result = AuthValidator.validatePassword('Password123');
            expect(result).toBe('Password123');
        });

        it('should throw if password is empty', () => {
            expect(() =>
                AuthValidator.validatePassword('')
            ).toThrow(ValidationError);
        });

        it('should reject short password', () => {
            expect(() =>
                AuthValidator.validatePassword('Aa1')
            ).toThrow(ValidationError);
        });

        it('should reject long password', () => {
            const long = 'A'.repeat(129) + 'a1';
            expect(() =>
                AuthValidator.validatePassword(long)
            ).toThrow(ValidationError);
        });

        it('should reject password without required complexity', () => {
            expect(() =>
                AuthValidator.validatePassword('alllowercase123')
            ).toThrow(ValidationError);
        });
    });

    describe('validateDisplayName', () => {
        it('should trim and return valid name', () => {
            const result = AuthValidator.validateDisplayName('  John  ');
            expect(result).toBe('John');
        });

        it('should throw if empty', () => {
            expect(() =>
                AuthValidator.validateDisplayName('')
            ).toThrow(ValidationError);
        });

        it('should reject whitespace-only name', () => {
            expect(() =>
                AuthValidator.validateDisplayName('   ')
            ).toThrow(ValidationError);
        });

        it('should reject too short name', () => {
            expect(() =>
                AuthValidator.validateDisplayName('A')
            ).toThrow(ValidationError);
        });

        it('should reject too long name', () => {
            const long = 'A'.repeat(101);
            expect(() =>
                AuthValidator.validateDisplayName(long)
            ).toThrow(ValidationError);
        });
    });

    describe('validateRegisterBody', () => {
        it('should pass valid payload', () => {
            expect(() =>
                AuthValidator.validateRegisterBody({
                    email: 'test@test.com',
                    password: 'Password123',
                    displayName: 'John'
                })
            ).not.toThrow();
        });

        it('should aggregate multiple errors', () => {
            try {
                AuthValidator.validateRegisterBody({
                    email: 'bad',
                    password: '123',
                    displayName: ''
                } as any);
            } catch (e) {
                expect(e).toBeInstanceOf(ValidationError);
                expect((e as ValidationError).errors.length).toBeGreaterThan(1);
            }
        });
    });

    describe('validateLoginBody', () => {
        it('should pass valid login', () => {
            expect(() =>
                AuthValidator.validateLoginBody({
                    email: 'test@test.com',
                    password: 'Password123'
                })
            ).not.toThrow();
        });

        it('should throw aggregated errors', () => {
            expect(() =>
                AuthValidator.validateLoginBody({
                    email: 'bad',
                    password: '123'
                } as any)
            ).toThrow(ValidationError);
        });
    });

    describe('validateRefreshBody', () => {
        it('should pass valid token', () => {
            expect(() =>
                AuthValidator.validateRefreshBody({
                    refreshToken: 'token123'
                })
            ).not.toThrow();
        });

        it('should reject missing token', () => {
            expect(() =>
                AuthValidator.validateRefreshBody({
                    refreshToken: '' as any
                })
            ).toThrow(ValidationError);
        });

        it('should reject empty token', () => {
            expect(() =>
                AuthValidator.validateRefreshBody({
                    refreshToken: '   '
                })
            ).toThrow(ValidationError);
        });
    });

    describe('validateLogoutBody', () => {
        it('should pass valid token', () => {
            expect(() =>
                AuthValidator.validateLogoutBody({
                    refreshToken: 'token123'
                })
            ).not.toThrow();
        });

        it('should reject missing token', () => {
            expect(() =>
                AuthValidator.validateLogoutBody({
                    refreshToken: '' as any
                })
            ).toThrow(ValidationError);
        });

        it('should reject empty token', () => {
            expect(() =>
                AuthValidator.validateLogoutBody({
                    refreshToken: '   '
                })
            ).toThrow(ValidationError);
        });
    });

});