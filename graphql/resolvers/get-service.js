import { util } from '@aws-appsync/utils';

export function request(ctx) {
    const { args: { serviceName } } = ctx;

    // We want to ensure that the put item can only be entered once.
    return {
        operation: 'GetItem',
        key: { 
            "eventName": util.dynamodb.toDynamoDB(`created:${serviceName}`),
            "timestamp": util.dynamodb.toDynamoDB(0)
        }
    };
}

export function response(ctx) {
    return ctx.result;
}