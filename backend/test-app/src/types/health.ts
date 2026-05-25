export const HealthResponseBody = {
    type: 'object',
    properties: {
        data: {
            type: 'object',
            properties: {
                status: { type: 'string', enum: ['ok', 'degraded', 'fail'] },
                services: {
                    type: 'object',
                    properties: {
                        db: { type: 'boolean' },
                        rabbitmq: { type: 'boolean' },
                    },
                    required: ['db', 'rabbitmq'],
                },
            },
            required: ['status', 'services'],
        },
    },
    required: ['data'],
};