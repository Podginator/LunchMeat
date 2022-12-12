import { APIGatewayEvent, APIGatewayProxyResultV2, APIGatewayEventRequestContext } from "aws-lambda";
import { DynamoDB, StepFunctions} from "aws-sdk";
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'sendAuthToWebsocket' });
const documentClient = new DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const stepFunction = new StepFunctions();

type ApprovalEvent = { 
  approved: boolean, 
  serviceName: string
};

// We only need to check whether it exists, so we just need the servicename.
type ServiceInfoPartial = { 
  serviceName: string
}


const getServiceFromDynamoDb = async (serviceName: string): Promise<ServiceInfoPartial | null> => { 
  const getRequest = { 
    TableName: process.env.TABLE_NAME!!, 
    Key: { 
      eventName: `created:${decodeURI(serviceName)}`,
      timestamp: 0
    }
  };

  return documentClient.get(getRequest).promise()
    .then(it => it.Item as ServiceInfoPartial);
}

export async function handler(event: APIGatewayEvent, _: APIGatewayEventRequestContext): Promise<APIGatewayProxyResultV2> { 
    const approvalEvent =  event.pathParameters as unknown as ApprovalEvent;
    const token = decodeURI(event.queryStringParameters?.token!);

    logger.info(`Received Event for ${JSON.stringify(approvalEvent)}`);
    logger.info(`Token: ${token}`);

    if (!token || !approvalEvent.serviceName) { 
      return { 
        statusCode: 404,
        body: JSON.stringify({ 
          error: 'Cannot Find Token.'
        })
      };
    }

    const existsInDatabase = await getServiceFromDynamoDb(approvalEvent.serviceName);
    if (!existsInDatabase) { 
      return { 
        statusCode: 404,
        body: JSON.stringify({ 
          error: `Cannot Find ${approvalEvent.serviceName}.`
        })
      };
    }

    await stepFunction.sendTaskSuccess({
      output: JSON.stringify({ 
        approved: new Boolean(approvalEvent.approved),
        serviceName: approvalEvent.serviceName,
      }),
      taskToken: token
    })
    .promise()


    return { 
      statusCode: 200
    };
}