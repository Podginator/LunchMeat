import { DynamoDB } from "aws-sdk";
import { mergeMap } from "rxjs";
import { DynamoDbAlias } from "../types/DynamoDbAlias";
import { LunchMeatMetadata } from "../types/LunchMeatMetadata";

const dynamodbClient = new DynamoDB.DocumentClient();

export const getServiceInformation = async (uuid: string): Promise<DynamoDbAlias> => {
    return dynamodbClient.get({ 
        Key: { 
            eventName: `alias:${uuid.toLowerCase()}`,
            timestamp: 0,
        },
        TableName: process.env.TABLE_NAME!!
    })
    .promise()
    .then(it => { 
        if (!it.Item) { 
            throw new Error(`Email Alias ${uuid} Not Found Error`);
        }

        return {
            eventName: it.Item!.eventName,
            serviceName: it.Item!.serviceName
        };
    })
  };

export const saveDataToDynamoDb = mergeMap(async (metadata: LunchMeatMetadata) => {
    return dynamodbClient.put({ 
        TableName: process.env.TABLE_NAME!!, 
        Item: { 
            eventName: `message:${metadata.serviceName}`, 
            ...metadata
        }
    })
    .promise();
});