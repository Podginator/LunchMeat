import { DynamoDB } from "aws-sdk";

const documentClient = new DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

interface SignUpComplete { 
  serviceName: string;
  approved: boolean;
}

enum VERIFICATION_STATUS { 
  UNVERIFIED = "UNVERIFIED",
  APPROVED = "APPROVED", 
  INVALID = "INVALID"
}

export async function handler(event: SignUpComplete): Promise<SignUpComplete> { 
  await documentClient.update({ 
    TableName: process.env.TABLE_NAME!,
    Key: { 
      eventName: `created:${event.serviceName}`,
      timestamp: 0
    },
    UpdateExpression: "SET #validation_status = :validation_status",
    ExpressionAttributeValues: { 
      ":validation_status": event.approved ? VERIFICATION_STATUS.APPROVED : VERIFICATION_STATUS.INVALID 
    },
    ExpressionAttributeNames: { 
      "#validation_status": "status"
    }
  })
  .promise();

  return event;
}