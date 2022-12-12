import { DynamoDBStreamEvent } from "aws-lambda";
import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDB, StepFunctions } from "aws-sdk";

const { STEPFUNCTION_ARN } = process.env;

const stepFunctions = new StepFunctions({ apiVersion: '2016-11-23' })
const logger = new Logger({ serviceName: 'createdServiceLambda' });

export async function handler(event: DynamoDBStreamEvent): Promise<void> {
  const receivedEvents = event.Records
    .map(it => DynamoDB.Converter.unmarshall(it.dynamodb?.NewImage!))

  logger.info(`Received Events ${JSON.stringify(receivedEvents)}`);

  const promiseStepfunctionsStart = receivedEvents.map(it => stepFunctions.startExecution({ stateMachineArn: STEPFUNCTION_ARN!, input: JSON.stringify(it) }).promise())
  await Promise.all(promiseStepfunctionsStart);

  return;
}