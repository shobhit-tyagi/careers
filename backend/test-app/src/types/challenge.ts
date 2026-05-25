import { Type } from '@sinclair/typebox';

export const CompleteChallengeBody = Type.Object({
    listenDurationPercent: Type.Number({
        minimum: 0,
        maximum: 100,
    }),
});