import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { Construct } from "constructs";
import { HostedZone, ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { Duration } from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import { PolicyStatement, CanonicalUserPrincipal } from "aws-cdk-lib/aws-iam";
import {
  OriginAccessIdentity,
  Distribution,
  SecurityPolicyProtocol,
  AllowedMethods,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

export class WebsiteHosting extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const siteDomain = process.env.ZONE_NAME!!;

    const cert = Certificate.fromCertificateArn(
      scope,
      "ACM_Certificate_Web",
      process.env.CLOUDFRONT_CERTARN!!
    );

    const hostedZone = HostedZone.fromLookup(scope, "webHostedZone", {
      domainName: process.env.ZONE_NAME!!,
    });

    const oai = new OriginAccessIdentity(scope, "cloudfrontOai", {
      comment: `oai for ${id}`,
    });

    const siteBucket = new Bucket(scope, "siteBucket", {
      bucketName: `lunchmeat.${siteDomain}`,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
      autoDeleteObjects: true, // NOT recommended for production code
    });

    // Grant access to cloudfront
    siteBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [siteBucket.arnForObjects("*")],
        principals: [
          new CanonicalUserPrincipal(
            oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    // CloudFront distribution
    const distribution = new Distribution(this, "siteDistribution", {
      certificate: cert,
      defaultRootObject: "index.html",
      domainNames: [`lm.${siteDomain}`],
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(30),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
      defaultBehavior: {
        origin: new S3Origin(siteBucket, { originAccessIdentity: oai }),
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    new ARecord(scope, "siteAliasRecord", {
      recordName: "lm",
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: hostedZone,
    });

    new BucketDeployment(this, "deployWithInvalidation", {
      sources: [Source.asset("../../frontend/build")],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
    });
  }
}