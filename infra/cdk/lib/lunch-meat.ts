import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { DynamoDBTable } from "./dynamodb";
import { WebsiteHosting } from "./website";
import * as dotenv from "dotenv";
import { AppSyncGraphql } from "./app-sync";
import { CreatedServiceLambda } from "./created-service-lambda";
import { StepFunctions } from "./step-functions";
import { Email } from "./email";

dotenv.config();

export class LunchMeatStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: process.env.CDK_ACCOUNT,
        region: process.env.CDK_REGION,
      },
    });

    const ddb = new DynamoDBTable(this, `${id}-ddb`);
    const stepFunctions = new StepFunctions(this, `${id}-stepfunctions`, ddb.table)
    const appSync = new AppSyncGraphql(this, `${id}-gql`, ddb.table);
    const createdServiceLambda = new CreatedServiceLambda(this, `${id}-created-lambda`, ddb.table, stepFunctions.stepFunctionArn);
    const web = new WebsiteHosting(this, `${id}-website`);
    const email = new Email(this, `${id}-email`, ddb.table);
  }
}
