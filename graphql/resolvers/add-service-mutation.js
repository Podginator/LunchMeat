import { util } from '@aws-appsync/utils';

export function request(ctx) {
    const { args: { serviceName, signUpUrl } } = ctx;
    const uuid = util.autoKsuid();
    const status = "UNVERIFIED";
    const timestamp = util.time.nowEpochMilliSeconds();

    // We want to ensure that the put item can only be entered once.
    return {
        operation: 'PutItem',
        key: util.dynamodb.toMapValues({ eventName: `created:${serviceName}`, timestamp: 0 }),
        attributeValues: util.dynamodb.toMapValues({ uuid, status, createdAt: timestamp, signUpUrl, serviceName }),
        condition: {
            expression: "attribute_not_exists(eventName)"
        }
    };
}

export function response(ctx) {
    if (ctx.error && ctx.error.type == "DynamoDB:ConditionalCheckFailedException") { 
        return util.error("Service Already Exists", "SERVICE_CONFLICT");
    }
    
    
    return ctx.result;
}