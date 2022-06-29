import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";

export class CdkLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const tableName = 'dynamo-table';

    // create dynamodb
    const dataTable = new dynamodb.Table(this, 'dynamodb', {
      tableName: tableName,
        partitionKey: { name: 'user-id', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'name', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    
    // create lambda-funtional-url
    const lambdaFunctionUrl = new lambda.Function(this, "LambdaFunctionUrl", {
      description: 'lambda function url',
      runtime: lambda.Runtime.NODEJS_14_X, 
      code: lambda.Code.fromAsset("../lambda-function-url"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(3),
      environment: {
        tableName: tableName,
      }
    }); 

    // dynamodb permission
    dataTable.grantReadWriteData(lambdaFunctionUrl);

    // define funtional url
    const fnUrl = lambdaFunctionUrl.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM // NONE,
    });

    // define the role of function url
    const fnUrlRole = new iam.Role(this, 'fnUrlRole', {
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
      description: 'Role for lambda function url',
    });    

    // apply the defined role
    fnUrl.grantInvokeUrl(fnUrlRole);

    // check the arn of funtion url role
    new cdk.CfnOutput(this, 'fnUrlRoleArn', {
      value: fnUrlRole.roleArn,
      description: 'The arn of funtion url role',
    });    

    // check the address of lambda funtion url
    new cdk.CfnOutput(this, 'EndpointUrl', {
      value: fnUrl.url,
      description: 'The endpoint of Lambda Function URL',
    });
  }
}
