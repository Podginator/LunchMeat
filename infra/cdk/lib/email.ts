import { HostedZone, MxRecord, TxtRecord } from "aws-cdk-lib/aws-route53";
import { EmailIdentity, Identity, ReceiptRuleSet } from "aws-cdk-lib/aws-ses";
import { S3 } from "aws-cdk-lib/aws-ses-actions";
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Construct } from "constructs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Duration } from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { SqsDestination } from "aws-cdk-lib/aws-s3-notifications";
import { AssetCode, Runtime, Function } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class Email extends Construct {

    constructor(scope: Construct, id: string, table: Table) {
        super(scope, id);

        const hostedZone = HostedZone.fromLookup(scope, "ses-domain-hosted-zone", {
			domainName: process.env.ZONE_NAME!!,
        });


        const dlq = new Queue(this, 'ses-sqs-dlq');

        const sqsQueue = new Queue(this, 'ses-sqs-queue', { 
            visibilityTimeout: Duration.seconds(60),
            deadLetterQueue: {
                queue: dlq, 
                maxReceiveCount: 3
            },
        });

        const s3Bucket = new Bucket(this, 'email-storage-bucket', { 
            bucketName: 'lunchmeat-ses-storage'
        })

        s3Bucket.addEventNotification(EventType.OBJECT_CREATED, new SqsDestination(sqsQueue))

        s3Bucket.addLifecycleRule({ 
            id: "delete-mail-rule", 
            expiration: Duration.days(7),

        });

        const domainIdentity = new EmailIdentity(this, 'ses-domain-identity', { 
            identity: Identity.publicHostedZone(hostedZone)
        });

        const receiptRules = new ReceiptRuleSet(this, 'ses-ruleset', { 
            receiptRuleSetName: 'lunchmeat-ruleset',
            dropSpam: false, 
            rules: [ 
                {
                    recipients: [process.env.ZONE_NAME!!],
                    scanEnabled: true,
                    actions: [
                        new S3({
                            bucket: s3Bucket
                        })
                    ]
                }
            ]
        });

        const mxRecord = new MxRecord(this, 'mx-ses', { 
            values: [ 
                { 
                    priority: 10, 
                    hostName: `inbound-smtp.${process.env.CDK_REGION}.amazonaws.com`
                }
            ],
            zone: hostedZone,
            ttl: Duration.seconds(30)
        })

        const txtRecord = new TxtRecord(this, 'txt-ses', { 
            values: ["v=spf1 include:amazonses.com ~all"],
            zone: hostedZone,
            ttl: Duration.seconds(30)
        });

        const lambdaDynamo = this.createLambdaDynamo(table, sqsQueue, s3Bucket)

        // //Necessary to activate the ruleset instead of relying on this manually
        // const awsSdkCall: AwsSdkCall = {
        //     service: 'SES',
        //     action: 'setActiveReceiptRuleSet',
        //     physicalResourceId:  PhysicalResourceId.of('DefaultSesCustomResource'),
        //     parameters: {
        //         RuleSetName: 'lunchmeat-ruleset',
        //     }
        // }
        // // Execution context for this service call
        // const customResource: AwsCustomResource = new AwsCustomResource(this, "ses_default_rule_set_custom_resource", {
        //         onCreate: awsSdkCall,
        //         onUpdate: awsSdkCall,
        //         logRetention: RetentionDays.ONE_WEEK,
        //         policy: AwsCustomResourcePolicy.fromStatements([
        //             new PolicyStatement({
        //                 sid: 'SesCustomResourceSetActiveReceiptRuleSet',
        //                 effect: Effect.ALLOW,
        //                 actions: ['ses:SetActiveReceiptRuleSet'],
        //                 resources: ['*']
        //             })
        //         ]),
        //         timeout: Duration.seconds(30)
        //     }
        // );

    }
    
    createLambdaDynamo(table: Table, sqs: Queue, bucket: Bucket) { 
        const processEventLambda = new Function(this, "sendEmailToDynamoDbFunction", {
            code: new AssetCode("../../email-handlers/register-message-to-dynamodb/build"),
            handler: "index.handler",
            runtime: Runtime.NODEJS_18_X,
            environment: {
                TABLE_NAME: table.tableName, 
                DOMAIN_NAME: process.env.ZONE_NAME!
            },
            timeout: Duration.minutes(1),
            memorySize: 512,
        });

         table.grantReadWriteData(processEventLambda);
         bucket.grantRead(processEventLambda)
         processEventLambda.addEventSource(new SqsEventSource(sqs));
    }
}