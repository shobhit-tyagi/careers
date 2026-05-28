import { ChallengeValidator } from '../../src/validators/challengeValidator';
import { ValidationError } from '../../src/types/errors';

describe('ChallengeValidator', () => {

    describe('validateId', () => {
        it('should pass valid id', () => {
            expect(() => {
                ChallengeValidator.validateId('abc123');
            }).not.toThrow();
        });

        it('should throw for empty id', () => {
            expect(() => {
                ChallengeValidator.validateId('');
            }).toThrow(ValidationError);
        });

        it('should throw for undefined-like falsy id', () => {
            expect(() => {
                ChallengeValidator.validateId(undefined as any);
            }).toThrow(ValidationError);
        });
    });

    describe('validateListQuery', () => {
        it('should pass valid numeric query params', () => {
            expect(() => {
                ChallengeValidator.validateListQuery({
                    page: '1',
                    limit: '10',
                });
            }).not.toThrow();
        });

        it('should pass empty query', () => {
            expect(() => {
                ChallengeValidator.validateListQuery({});
            }).not.toThrow();
        });

        it('should throw if page is not numeric', () => {
            expect(() => {
                ChallengeValidator.validateListQuery({
                    page: 'abc',
                });
            }).toThrow(ValidationError);
        });

        it('should throw if limit is not numeric', () => {
            expect(() => {
                ChallengeValidator.validateListQuery({
                    limit: 'xyz',
                });
            }).toThrow(ValidationError);
        });
    });

    describe('validateCompleteBody', () => {
        it('should pass valid percent', () => {
            expect(() => {
                ChallengeValidator.validateCompleteBody({
                    listenDurationPercent: 50,
                });
            }).not.toThrow();
        });

        it('should throw if value is undefined', () => {
            expect(() => {
                ChallengeValidator.validateCompleteBody({
                    listenDurationPercent: undefined as any,
                });
            }).toThrow(ValidationError);
        });

        it('should throw if value is null', () => {
            expect(() => {
                ChallengeValidator.validateCompleteBody({
                    listenDurationPercent: null as any,
                });
            }).toThrow(ValidationError);
        });

        it('should throw if value < 0', () => {
            expect(() => {
                ChallengeValidator.validateCompleteBody({
                    listenDurationPercent: -1,
                });
            }).toThrow(ValidationError);
        });

        it('should throw if value > 100', () => {
            expect(() => {
                ChallengeValidator.validateCompleteBody({
                    listenDurationPercent: 101,
                });
            }).toThrow(ValidationError);
        });
    });

});