# AWS CDK를 이용한 Lambda 함수 URL 생성

인프라를 장기적으로 관리하기 위해선 [IaC(Infrastruce as Code)](https://docs.aws.amazon.com/whitepapers/latest/introduction-devops-aws/infrastructure-as-code.html)를 활용하는것이 좋습니다. 아래와 같이 Typescript를 이용하여 [AWS CDK](https://docs.aws.amazon.com/whitepapers/latest/introduction-devops-aws/aws-cdk.html)로 간단하게 DynamoDB와 Lambda를 정의 할 수 있습니다.

```java
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
```

또한, 아래와 같이 Lambda가 DynamoDB를 사용할 수 있도록 읽기, 쓰기 퍼미션을 부여하고, Lambda 함수 URL을 정의 할 수 있습니다. 여기서, [resource-based policy](https://docs.amazonaws.cn/en_us/lambda/latest/dg/access-control-resource-based.html)를 사용하기 위하여 fnUrlRole을 정의하여 사용합니다. 상세 코드는 [github](https://github.com/kyopark2014/lambda-function-url/blob/main/cdk-lambda/lib/cdk-lambda-stack.ts)에서 확인 하실 수 있습니다.


```java
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
```

상기와 같이 Lambda 함수 URL와 DynamoDB를 선언하고 아래 명령어로 인프라를 손쉽게 생성 할 수 있습니다. 

```c
$ cdk deploy
```

인프라 생성 및 배포가 끝나면 아래와 같이 Lambda 함수 URL의 Endpoint 주소와 fnUrlRole의 Arn을 알 수 있습니다.

```c
Outputs:
CdkLambdaStack.EndpointUrl = https://atkqt4btjeqnh3sarsdd5rhklm0mftdy.lambda-url.ap-northeast-2.on.aws/
CdkLambdaStack.fnUrlRoleArn = arn:aws:iam::123456789012:role/CdkLambdaStack-fnUrlRoleF3FB2EB9-1GN82O6QTTIND
```

