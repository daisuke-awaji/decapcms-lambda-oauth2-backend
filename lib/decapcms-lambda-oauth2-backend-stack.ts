import * as cdk from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as iam from "aws-cdk-lib/aws-iam";

export class DecapCMSLambdaOauth2BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const oauthGithubClientId = ssm.StringParameter.fromStringParameterAttributes(this, "OauthGithubClientId", {
      parameterName: "/CDK/DecapCMSOAuthBackend/OAUTH_GITHUB_CLIENT_ID",
    });
    const oauthGithubClientSecret = ssm.StringParameter.fromStringParameterAttributes(this, "OauthGithubClientSecret", {
      parameterName: "/CDK/DecapCMSOAuthBackend/OAUTH_GITHUB_CLIENT_SECRET",
    });

    const defaultPathFunction = new NodejsFunction(this, "lambda", {
      entry: "src/index.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_18_X,
    });

    const iamRoleForLambda = new iam.Role(this, "SSMSecureStringLambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"),
      ],
    });

    const authFunction = new NodejsFunction(this, "AuthFunction", {
      entry: "src/auth.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_18_X,
      role: iamRoleForLambda,
      environment: {
        OAUTH_GITHUB_CLIENT_ID: oauthGithubClientId.stringValue,
        OAUTH_GITHUB_CLIENT_SECRET: oauthGithubClientSecret.stringValue,
      },
    });
    const callbackFunction = new NodejsFunction(this, "CallbackFunction", {
      entry: "src/callback.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_18_X,
      role: iamRoleForLambda,
      environment: {
        OAUTH_GITHUB_CLIENT_ID: oauthGithubClientId.stringValue,
        OAUTH_GITHUB_CLIENT_SECRET: oauthGithubClientSecret.stringValue,
      },
    });

    const api = new LambdaRestApi(this, "OAuth2BackendAPI", {
      handler: defaultPathFunction,
      proxy: false,
    });

    const auth = api.root.addResource("auth");
    auth.addMethod("GET", new cdk.aws_apigateway.LambdaIntegration(authFunction));

    const callback = api.root.addResource("callback");
    callback.addMethod("GET", new cdk.aws_apigateway.LambdaIntegration(callbackFunction));

    new cdk.CfnOutput(this, "authpath", {
      value: api.url + "auth",
      description: "auth",
    });
    new cdk.CfnOutput(this, "callbackpath", {
      value: api.url + "callback",
      description: "callback",
    });
  }
}
