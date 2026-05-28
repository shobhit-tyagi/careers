import { RewardValidator } from '../../src/validators/rewardValidator';
import { ValidationError } from '../../src/types/errors';

describe('RewardValidator', () => {

    describe('validateRedeem', () => {

        it('should pass with valid id and body', () => {
            expect(() => {
                RewardValidator.validateRedeem('reward-123', { any: 'payload' });
            }).not.toThrow();
        });

        it('should throw if id is empty string', () => {
            expect(() => {
                RewardValidator.validateRedeem('', { any: 'payload' });
            }).toThrow(ValidationError);
        });

        it('should throw if id is undefined', () => {
            expect(() => {
                RewardValidator.validateRedeem(undefined as any, { any: 'payload' });
            }).toThrow(ValidationError);
        });

        it('should throw if id is null', () => {
            expect(() => {
                RewardValidator.validateRedeem(null as any, { any: 'payload' });
            }).toThrow(ValidationError);
        });

    });

});