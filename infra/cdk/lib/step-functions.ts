import { Construct } from "constructs";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Chain, IntegrationPattern, JsonPath, StateMachine, Succeed, TaskInput } from 'aws-cdk-lib/aws-stepfunctions';
import { AssetCode, Runtime } from "aws-cdk-lib/aws-lambda";
import { Function, Permission } from "aws-cdk-lib/aws-lambda";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Effect, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGateway } from "aws-cdk-lib/aws-route53-targets";


export class StepFunctions extends Construct {
    stepFunctionArn = '';


    private LAMBDA_DEFAULT_PROPS = {
        handler: 'index.handler',
        runtime: Runtime.NODEJS_18_X,
    };

    private LAMBDA_DIR = `${__dirname}/../../../step-functions/functions`;

    constructor(scope: Construct, id: string, table: Table) {
        super(scope, id);

        const automatedSignUp = this.automatedSignUpLambda();
        const manualSignUp = this.manualSignUpLambda(process.env.API_DOMAIN!!)
        const validationComplete = this.validationCompleteLambda(table);
        const stepFn = this.createStepFunction(automatedSignUp, manualSignUp, validationComplete);
        const api = this.validateApi(table, stepFn?.stateMachineArn);

        this.stepFunctionArn = stepFn?.stateMachineArn;
    }

    automatedSignUpLambda(): Function {
        return new Function(this, `automatedSignUpLambda`, {
            ...this.LAMBDA_DEFAULT_PROPS,
            code: new AssetCode(`${this.LAMBDA_DIR}/automate-sign-up/build`)
        });
    }

    manualSignUpLambda(apiAddress: string): Function {
        const manualSignUp = new Function(this, `manualSignUpLambda`, {
            ...this.LAMBDA_DEFAULT_PROPS,
            environment: { 
                EMAIL: process.env.EMAIL_ADDRESS!,
                API_ADDRESS: apiAddress

            },
            code: new AssetCode(`${this.LAMBDA_DIR}/manual-sign-up/build`)
        });

        const sesPermission = new PolicyStatement({
            actions: ['ses:*'],
            resources: [process.env.EMAIL_ARN!]
        })

        manualSignUp.role?.attachInlinePolicy(new Policy(this, 'ses-permission', { statements: [sesPermission] }));
        return manualSignUp;
    }

    validationCompleteLambda(table: Table): Function {
        const validation = new Function(this, `validationCompleteLambda`, {
            ...this.LAMBDA_DEFAULT_PROPS,
            code: new AssetCode(`${this.LAMBDA_DIR}/validate-complete/build`),
            environment: { 
                TABLE_NAME: table.tableName
            }
        });

        table.grantReadWriteData(validation);

        return validation;
    }

    validateApi(table: Table, stepsArn: string): RestApi | null {
        const validatehRestApi = new RestApi(this, "validationLMApi", {
            restApiName: "Validate Email Signon",
            defaultCorsPreflightOptions: {
                allowHeaders: [
                    '*',
                ],
                allowMethods: ['*'],
                allowCredentials: true,
                allowOrigins: ['*'],
            },
            domainName: {
                domainName: process.env.API_DOMAIN!!,
                certificate: Certificate.fromCertificateArn(
                    this,
                    "ACM_Certificate_LM_API",
                    process.env.CERT_ARN!!
                ),
            },
        });

        const validateFunction = new Function(this, "validationApi", {
            code: new AssetCode(`${this.LAMBDA_DIR}/validate-sign-up/build`),
            handler: "index.handler",
            runtime: Runtime.NODEJS_18_X,
            memorySize: 1024,
            environment: {
                TABLE_NAME: table.tableName,
                STEPS_ARN: stepsArn,
            }
        });
        table.grantReadData(validateFunction);

        const stateMachinePolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["states:SendTaskSuccess", "states:SendTaskFailure"],
            resources: [stepsArn],
        });

        validateFunction.role?.attachInlinePolicy(new Policy(this, "stateMachineSendTask", {
            statements: [stateMachinePolicy],
        }));

        const approve = validatehRestApi.root.addResource("approve")
        const serviceName = approve.addResource('{serviceName}')
        const approved = serviceName.addResource('{approved}')

        approved.addMethod("GET", new LambdaIntegration(validateFunction));
        const hostedZone = HostedZone.fromLookup(this, 'apiHostedZone', {
            domainName: process.env.ZONE_NAME!!,
        });
        new ARecord(this, "apiGatewayRecordSetRestApi", {
            recordName: "api-lm",
            zone: hostedZone,
            target: RecordTarget.fromAlias(
                new ApiGateway(validatehRestApi)
            ),
        });
        return validatehRestApi;
    }

    createStepFunction(automatedSignUpLambda: Function, manualSignUpLambda: Function, validationCompleteLambda: Function): StateMachine {
        const manualSignUpInvoke = new LambdaInvoke(this, "Manual Signup", {
            lambdaFunction: manualSignUpLambda,
            comment: 'Attempts to manually sign up based on url provided.',
            integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
            payload: TaskInput.fromObject({
                token: JsonPath.taskToken,
                emailInfo: JsonPath.entirePayload
            })
        })

        const automatedInvoke = new LambdaInvoke(this, "AutomatedSignup", {
            lambdaFunction: automatedSignUpLambda,
            comment: 'Attempts to automatically sign up based on url provided.',
        });

        const validationLambda = new LambdaInvoke(this, 'ValidateComplete', {
            lambdaFunction: validationCompleteLambda,
        })

        automatedInvoke.addCatch(manualSignUpInvoke, {
            resultPath: "$.error",
            errors: ['States.ALL']
        }).next(validationLambda)
            .next(new Succeed(this, 'Completed Validation'))

        manualSignUpInvoke.next(
            validationLambda
        );

        const chain = Chain.start(
            automatedInvoke
        );

        return new StateMachine(this, 'StepFunctionLunchMeat', {
            definition: chain
        });
    }


}