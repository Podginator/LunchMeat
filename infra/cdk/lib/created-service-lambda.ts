import { Table } from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement, Policy } from "aws-cdk-lib/aws-iam";
import { StartingPosition, AssetCode, Runtime, Function, FilterRule, FilterCriteria } from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";

export class CreatedServiceLambda extends Construct {


    constructor(scope: Construct, id: string, table: Table, stepfunctionArn: string) {
        super(scope, id);

        const processEventLambda = new Function(this, "sendAuthToWebsocketFunction", {
            code: new AssetCode("../../created-trigger/build"),
            handler: "index.handler",
            runtime: Runtime.NODEJS_18_X,
            environment: {
                STEPFUNCTION_ARN: stepfunctionArn
            },
            memorySize: 128,
        });

        const sesPermission = new PolicyStatement({
            actions: ['states:StartExecution'],
            resources: [stepfunctionArn]
        })

        processEventLambda.role?.attachInlinePolicy(new Policy(this, 'ses-permission', { statements: [sesPermission] }));

        processEventLambda.addEventSource(new DynamoEventSource(table, {
            startingPosition: StartingPosition.LATEST,
            batchSize: 5,
            bisectBatchOnError: true,
            retryAttempts: 3,
            filters: [
                FilterCriteria.filter({
                    eventName: FilterRule.isEqual('INSERT'),
                    dynamodb: {
                        Keys: {
                            eventName: {
                                S: FilterRule.beginsWith("created:")
                            }
                        }
                    }
                })
            ]
        }));
    }
}