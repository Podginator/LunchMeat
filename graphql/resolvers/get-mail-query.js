import { util } from '@aws-appsync/utils';

export function request(ctx) {
    const { serviceName } = ctx.args;
    let { start, end } = ctx.args; 
    start = start ? start : 0;
    end = end ? end : 9999999999999;
    

    // We want to ensure that the put item can only be entered once.
    return {
        operation: 'Query',
        query: {
            expression: "eventName = :eventName AND #timestamp BETWEEN :start AND :end",
            expressionNames: { "#timestamp": "timestamp" },
            expressionValues: {
                ":eventName": util.dynamodb.toDynamoDB(`message:${serviceName}`),
                ":start": util.dynamodb.toDynamoDB(start),
                ":end": util.dynamodb.toDynamoDB(end)
            }
        },
    };
}

export function response(ctx) {
    return ctx.result;
}