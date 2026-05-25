import {ValidationError} from '../types/errors';

export class ChallengeValidator {
    static validateId(id: string) {
        if (!id) {
            throw new ValidationError([
                {field: 'id', message: 'Invalid id'},
            ]);
        }
    }

    static validateListQuery(query: any) {
        if (query.page && isNaN(Number(query.page))) {
            throw new ValidationError([
                {field: 'page', message: 'Must be a number'},
            ]);
        }

        if (query.limit && isNaN(Number(query.limit))) {
            throw new ValidationError([
                {field: 'limit', message: 'Must be a number'},
            ]);
        }
    }

    static validateCompleteBody(body: {
        listenDurationPercent: number;
    }) {
        if (
            body.listenDurationPercent === undefined ||
            body.listenDurationPercent === null
        ) {
            throw new ValidationError([
                {
                    field: 'listenDurationPercent',
                    message: 'Required',
                },
            ]);
        }

        if (
            body.listenDurationPercent < 0 ||
            body.listenDurationPercent > 100
        ) {
            throw new ValidationError([
                {
                    field: 'listenDurationPercent',
                    message: 'Must be 0-100',
                },
            ]);
        }
    }
}