import { util } from '@aws-appsync/utils';

export function request(ctx) {
    const { serviceName, uuid } = ctx.prev.result;

    // We want to ensure that the put item can only be entered once.
    return {
        operation: 'PutItem',
        key: util.dynamodb.toMapValues({ eventName: `alias:${uuid.toLowerCase()}`, timestamp: 0 }),
        attributeValues: util.dynamodb.toMapValues({ serviceName }),
        condition: {
            expression: "attribute_not_exists(eventName)"
        }
    };
}

export function response(ctx) {
    if (ctx.error && ctx.error.type == "DynamoDB:ConditionalCheckFailedException") { 
        return util.error("Service Already Exists", "SERVICE_CONFLICT");
    }
    
    return ctx.prev.result;
}