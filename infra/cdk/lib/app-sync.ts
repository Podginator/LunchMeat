import { Table } from "aws-cdk-lib/aws-dynamodb";
import { CfnOutput } from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import { Construct } from "constructs";
import { CfnApiKey, CfnDataSource, CfnFunctionConfiguration, CfnDomainName, CfnGraphQLApi, CfnGraphQLSchema, CfnResolver, CfnDomainNameApiAssociation } from "aws-cdk-lib/aws-appsync";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { CnameRecord, HostedZone } from "aws-cdk-lib/aws-route53";


export class AppSyncGraphql extends Construct {

	constructor(scope: Construct, id: string, table: Table) {
		super(scope, id);

		const graphQlApi = new CfnGraphQLApi(this, 'AppSync', {
			name: 'lunchmeat-api',
			authenticationType: 'API_KEY',

		});

		const cert = Certificate.fromCertificateArn(
			this,
			"ACM_Certificate_LM_API",
			process.env.CLOUDFRONT_CERTARN!!
		)

		const apiDomainName = new CfnDomainName(this, `custom-appsync-domain`, {
			domainName: process.env.GRAPHQL_URL!!,
			certificateArn: cert.certificateArn,
		},
		);

		new CfnDomainNameApiAssociation(this, `custom-appsync-domain-assoc`, {
			apiId: graphQlApi.attrApiId,
			domainName: process.env.GRAPHQL_URL!!
		}).addDependsOn(apiDomainName);

		const hostedZone = HostedZone.fromLookup(scope, "api-gql-hosted-zone", {
			domainName: process.env.ZONE_NAME!!,
		  });
		
		  new CnameRecord(this, `CnameApiRecord`, {
            recordName: 'gql-lm',
            zone: hostedZone,
            domainName: apiDomainName.attrAppSyncDomainName
        });

		const apiKey = new CfnApiKey(this, 'AppSyncApiKey', {
			apiId: graphQlApi.attrApiId,
		});

		const itemsTableRole = new Role(this, 'AppSyncRole', {
			assumedBy: new ServicePrincipal('appsync.amazonaws.com')
		});

		itemsTableRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')); // Todo: Limit this, surely. 

		const cfnGraphQLSchema = new CfnGraphQLSchema(
			this,
			'SampleSchema',
			{
				apiId: graphQlApi.attrApiId,
				definition: fs.readFileSync(
					path.join(__dirname, '../../../graphql/schema.graphql'),
					'utf8'
				),
			}
		)


		const dataSource = new CfnDataSource(this, 'ItemsDataSource', {
			apiId: graphQlApi.attrApiId,
			name: 'LunchMeatSource',
			type: 'AMAZON_DYNAMODB',
			dynamoDbConfig: {
				tableName: table.tableName,
				awsRegion: 'eu-west-1'
			},
			serviceRoleArn: itemsTableRole.roleArn
		});

		const addServiceResolver = new CfnFunctionConfiguration(
			this,
			'AddServiceResolverConfig',
			{
				name: 'addServiceResolver',
				apiId: graphQlApi.attrApiId,
				dataSourceName: dataSource.attrName,
				functionVersion: '2018-05-29',
			}
		)

		addServiceResolver.addOverride('Properties.Runtime.Name', 'APPSYNC_JS')
		addServiceResolver.addOverride('Properties.Runtime.RuntimeVersion', '1.0.0')
		addServiceResolver.addOverride(
			'Properties.Code',
			fs.readFileSync(path.join(__dirname, '../../../graphql/resolvers/add-service-mutation.js'), 'utf8')
		)

		const addServiceMappingResolver = new CfnFunctionConfiguration(
			this,
			'AddServiceMappingResolverConfig',
			{
				name: 'addServiceMappingResolver',
				apiId: graphQlApi.attrApiId,
				dataSourceName: dataSource.attrName,
				functionVersion: '2018-05-29',
			}
		)

		addServiceMappingResolver.addOverride('Properties.Runtime.Name', 'APPSYNC_JS')
		addServiceMappingResolver.addOverride('Properties.Runtime.RuntimeVersion', '1.0.0')
		addServiceMappingResolver.addOverride(
			'Properties.Code',
			fs.readFileSync(path.join(__dirname, '../../../graphql/resolvers/add-service-mapping-mutation.js'), 'utf8')
		)


		const addResolver = new CfnResolver(this, 'addItemResolver', {
			apiId: graphQlApi.attrApiId,
			typeName: 'Mutation',
			fieldName: 'createService',
			kind: 'PIPELINE',
			pipelineConfig: {
				functions: [addServiceResolver.attrFunctionId,  addServiceMappingResolver.attrFunctionId]
			}
		})

		addResolver.addDependsOn(addServiceResolver)

		addResolver.addOverride('Properties.Runtime.Name', 'APPSYNC_JS')
		addResolver.addOverride('Properties.Runtime.RuntimeVersion', '1.0.0')
		addResolver.addOverride(
			'Properties.Code',
			fs.readFileSync(path.join(__dirname, '/pipeline-mappings.js'), 'utf8')
		)


		const getServiceFn = new CfnFunctionConfiguration(
			this,
			'GetServiceResolverConfig',
			{
				name: 'getServiceResolver',
				apiId: graphQlApi.attrApiId,
				dataSourceName: dataSource.attrName,
				functionVersion: '2018-05-29',
			}
		)

		getServiceFn.addOverride('Properties.Runtime.Name', 'APPSYNC_JS')
		getServiceFn.addOverride('Properties.Runtime.RuntimeVersion', '1.0.0')
		getServiceFn.addOverride(
			'Properties.Code',
			fs.readFileSync(path.join(__dirname, '../../../graphql/resolvers/get-service.js'), 'utf8')
		)


		const getServiceResolver = new CfnResolver(this, 'getServiceResolver', {
			apiId: graphQlApi.attrApiId,
			typeName: 'Query',
			fieldName: 'getService',
			kind: 'PIPELINE',
			pipelineConfig: {
				functions: [getServiceFn.attrFunctionId]
			}
		})

		getServiceResolver.addDependsOn(getServiceResolver)
		getServiceResolver.addOverride('Properties.Runtime.Name', 'APPSYNC_JS')
		getServiceResolver.addOverride('Properties.Runtime.RuntimeVersion', '1.0.0')
		getServiceResolver.addOverride(
			'Properties.Code',
			fs.readFileSync(path.join(__dirname, '/pipeline-mappings.js'), 'utf8')
		)

		const getEmailsResolverFn = new CfnFunctionConfiguration(
			this,
			'GetMailResolverConfig',
			{
				name: 'getMailResolver',
				apiId: graphQlApi.attrApiId,
				dataSourceName: dataSource.attrName,
				functionVersion: '2018-05-29',
			}
		)

		getEmailsResolverFn.addOverride('Properties.Runtime.Name', 'APPSYNC_JS')
		getEmailsResolverFn.addOverride('Properties.Runtime.RuntimeVersion', '1.0.0')
		getEmailsResolverFn.addOverride(
			'Properties.Code',
			fs.readFileSync(path.join(__dirname, '../../../graphql/resolvers/get-mail-query.js'), 'utf8')
		)


		const getEmailsResolver = new CfnResolver(this, 'getEmailsResolver', {
			apiId: graphQlApi.attrApiId,
			typeName: 'Query',
			fieldName: 'getEmails',
			kind: 'PIPELINE',
			pipelineConfig: {
				functions: [getEmailsResolverFn.attrFunctionId]
			}
		})

		getEmailsResolver.addDependsOn(getServiceResolver)
		getEmailsResolver.addOverride('Properties.Runtime.Name', 'APPSYNC_JS')
		getEmailsResolver.addOverride('Properties.Runtime.RuntimeVersion', '1.0.0')
		getEmailsResolver.addOverride(
			'Properties.Code',
			fs.readFileSync(path.join(__dirname, '/pipeline-mappings.js'), 'utf8')
		)


		const getMessagesResolver = new CfnResolver(this, 'getMessagesResolver', {
			apiId: graphQlApi.attrApiId,
			typeName: 'MailQueryResults',
			fieldName: 'messages',
			kind: 'PIPELINE',
			pipelineConfig: {
				functions: []
			}
		})

		getMessagesResolver.addDependsOn(getServiceResolver)
		getMessagesResolver.addOverride('Properties.Runtime.Name', 'APPSYNC_JS')
		getMessagesResolver.addOverride('Properties.Runtime.RuntimeVersion', '1.0.0')
		getMessagesResolver.addOverride(
			'Properties.Code',
			fs.readFileSync(path.join(__dirname, '../../../graphql/resolvers/get-messages.js'), 'utf8')
		)


		const getMessageStatsResolver = new CfnResolver(this, 'getMessageStatsResolver', {
			apiId: graphQlApi.attrApiId,
			typeName: 'MailQueryResults',
			fieldName: 'stats',
			kind: 'PIPELINE',
			pipelineConfig: {
				functions: []
			}
		})

		getMessageStatsResolver.addDependsOn(getServiceResolver)
		getMessageStatsResolver.addOverride('Properties.Runtime.Name', 'APPSYNC_JS')
		getMessageStatsResolver.addOverride('Properties.Runtime.RuntimeVersion', '1.0.0')
		getMessageStatsResolver.addOverride(
			'Properties.Code',
			fs.readFileSync(path.join(__dirname, '../../../graphql/resolvers/get-stats.js'), 'utf8')
		)

		const getTotalCountResolver = new CfnResolver(this, 'getCountResolver', {
			apiId: graphQlApi.attrApiId,
			typeName: 'MailStats',
			fieldName: 'totalCount',
			kind: 'PIPELINE',
			pipelineConfig: {
				functions: []
			}
		})

		getTotalCountResolver.addDependsOn(getServiceResolver)
		getTotalCountResolver.addOverride('Properties.Runtime.Name', 'APPSYNC_JS')
		getTotalCountResolver.addOverride('Properties.Runtime.RuntimeVersion', '1.0.0')
		getTotalCountResolver.addOverride(
			'Properties.Code',
			fs.readFileSync(path.join(__dirname, '../../../graphql/resolvers/get-count.js'), 'utf8')
		)

		const spamCountResolver = new CfnResolver(this, 'getSpamResolver', {
			apiId: graphQlApi.attrApiId,
			typeName: 'MailStats',
			fieldName: 'spamCount',
			kind: 'PIPELINE',
			pipelineConfig: {
				functions: []
			}
		})

		spamCountResolver.addDependsOn(getServiceResolver)
		spamCountResolver.addOverride('Properties.Runtime.Name', 'APPSYNC_JS')
		spamCountResolver.addOverride('Properties.Runtime.RuntimeVersion', '1.0.0')
		spamCountResolver.addOverride(
			'Properties.Code',
			fs.readFileSync(path.join(__dirname, '../../../graphql/resolvers/get-spam-stats.js'), 'utf8')
		)

		const domainsResolver = new CfnResolver(this, 'getDomainsResolver', {
			apiId: graphQlApi.attrApiId,
			typeName: 'MailStats',
			fieldName: 'domains',
			kind: 'PIPELINE',
			pipelineConfig: {
				functions: []
			}
		})

		domainsResolver.addDependsOn(getServiceResolver)
		domainsResolver.addOverride('Properties.Runtime.Name', 'APPSYNC_JS')
		domainsResolver.addOverride('Properties.Runtime.RuntimeVersion', '1.0.0')
		domainsResolver.addOverride(
			'Properties.Code',
			fs.readFileSync(path.join(__dirname, '../../../graphql/resolvers/get-domains.js'), 'utf8')
		)

		new CfnOutput(this, 'GRAPHQL_URL', {
			value: graphQlApi.attrGraphQlUrl,
		})

		new CfnOutput(this, 'GRAPHQL_APIKEY', {
			value: apiKey.attrApiKey,
		})
	}
}