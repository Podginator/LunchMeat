import { util } from '@aws-appsync/utils';

export function request(ctx) {
}

export function response(ctx) {
    return ctx.source.scannedCount;
}