import { ValidationError } from '../types/errors';

export class RewardValidator {
    static validateRedeem(id: string, body: any) {
        if (!id) {
            throw new ValidationError([
                { field: 'id', message: 'Reward id required' },
            ]);
        }
    }
}