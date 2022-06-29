# Lambda Function URL

여기에서 [AWS CDK](https://github.com/kyopark2014/technical-summary/blob/main/cdk-introduction.md)로 Lambda funtion url을 생성하고 활용하는것에 대한 예제를 보여주고자 합니다. Lambda funtional url의 보안을 IAM을 통해 수행되고 이를 위해 client에서 temperary security credential을 이용한 접속 방법도 가이드 합니다. 


## AWS Console을 이용한 Lambda 함수 URL 생성하기

[AWS Console에서 Lambda 함수 URL 생성하기](https://github.com/kyopark2014/lambda-function-url/blob/main/console.md)에서는 AWS Console을 이용해 직관적으로 Lambda 함수 URL을 생성하는것을 설명합니다. 

## AWS CDK를 이용한 Lambda 함수 URL 생성하기
 
[AWS CDK를 이용한 Lambda 함수 URL 생성](https://github.com/kyopark2014/lambda-function-url/blob/main/cdk-lambda/README.md)에서는 IaC(Infrastructure as Code)를 이용해 손쉽게 Lambda 함수 URL을 생성하는것을 설명합니다. 

## Lambda 함수 URL 보안

Lambda 함수 URL은 인증 방식으로 AWS Identity and Access Management(IAM)만을 제공하므로, 외부 접속을 제한하기 위해서는 IAM을 사용하여야 합니다. 

![image](https://user-images.githubusercontent.com/52392004/171420558-e491ca84-b26e-43c5-af95-a1da86493bb9.png)

IAM Credential은 AccessKeyId와 SecretAccessKey으로 구성되는데, 외부에 공개되지 않도록 세심한 주의가 필요합니다. 따라서, client에서 IAM Credential을 직접 사용하기 보다는 [Temparary security credential](https://docs.aws.amazon.com/ko_kr/IAM/latest/UserGuide/id_credentials_temp.html)을 생성하여 사용하는것이 바람직합니다. [Temporary security credentials의 expire time을 설정](https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/prog-services-sts.html)하면,  최소 15분에서 최대 36시간까지 설정할 수 있으며, 기본값은 12시간입니다. 시간이 만료되면 더이상 사용할 수 없습니다.
Temporary security credentials은 STS(Security Token Server)을 통해 획득하는데, [resource-based policies를 따르므로 Lambda를 이용한 STS 연결](https://github.com/kyopark2014/aws-security-token-service/tree/main/lambda-for-sts)과 같이 AWS SDK를 이용해 생성할 수 있습니다.


Temporary security credentials은 STS(Security Token Server)을 통해 획득하는데, resource-based policies를 따르므로 [Lambda를 이용한 STS 연결](https://github.com/kyopark2014/aws-security-token-service/tree/main/lambda-for-sts)과 같이 AWS SDK를 이용해 생성할 수 있습니다. 



## Temperary Security Credential로 Lambda 함수 URL을 호출하는 Client 만들기 

[Temparary security credential 을 이용하여 Lambda Function URL 접속](https://github.com/kyopark2014/aws-security-token-service/blob/main/lambda-invation-using-temp-credential.md)에서는 Temperary security credential을 이용하여 Postman을 통해 Lambda 함수 URL에 접속하는 방법을 설명하고 있습니다. 하지만, 이러한 방법으로 Postman에 매번 Temparary security credential을 생성하여 넣는 것은 매우 번거로우므로, Client 직접 Temperary security credential을 생성하고 request를 보낼 수 있어야 합니다. 이것은 [Signing AWS requests with Signature Version 4](https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html)을 이용하여 [Crypto로 직접 인증을 수행](https://github.com/kyopark2014/aws-security-token-service/tree/main/lambda-for-authentification-request-using-crypto)하거나, AWS SDK를 통해 구현이 가능합니다. 아래에서는 AWS SDK를 이용해서 temparary security credential을 생성하고, 이를 이용해 request를 singing하는 과정을 설명합니다. 


#### AWS SDK를 이용하여 temparary security credential 생성

기 생성한 Role을 가지고 아래와 같이 STS를 통해 Temperary security credential을 생성합니다.

```java
   const params = {
        RoleArn: 'arn:aws:iam::123456789012:role/role-for-s3-fileserver',
        RoleSessionName: 'session',
    };
    const assumeRoleCommand = new AssumeRoleCommand(params);
    
    let data;
    try {
        data = await sTS.send(assumeRoleCommand);
    
        console.log('data: %j',data);
    } catch (error) {
          console.log(error);
    }
```

새로운 credential로 AWS의 Config를 업데이트 합니다.

```java
    aws.config.credentials.accessKeyId = data.Credentials.AccessKeyId;
    aws.config.credentials.sessionToken = data.Credentials.SessionToken;
    console.log("modified credentials: %j", aws.config.credentials);
```

#### signed된 request 생성 

아래와 같이 signature를 구합니다.

```java
    var region = 'ap-northeast-2';
    var domain = 'hgwavninyisqd6utbvywn7drpe0mvkwp.lambda-url.ap-northeast-2.on.aws';
    
    console.log('domain: '+domain);

    var myService = 'lambda';
    var myMethod = 'GET';
    var myPath = '/';
    var body = '';

    // Create the HTTP request
    var request = new HttpRequest({
        headers: {
            'host': domain
        },
        hostname: domain,
        method: myMethod,
        path: myPath,
        body: body,
    });
    console.log('request: %j', request);

    // Sign the request
    var signer = new SignatureV4({
        credentials: defaultProvider(),
        region: region,
        service: myService,
        sha256: Sha256
    });
    console.log('signer: %j', signer);

    var signedRequest;
    try {
        signedRequest = await signer.sign(request);
        console.log('signedRequest: %j', signedRequest);

    } catch(err) {
        console.log(err);
    }
```

아래와 같이 https로 Lambda Function URL에 접속을 합니다.

```java
    // request
    performRequest(domain, signedRequest.headers, signedRequest.body, myPath, myMethod, function(response) {    
        console.log('response: %j', response);
    });
    
    
// the REST API call using the Node.js 'https' module
function performRequest(endpoint, headers, data, path, method, success) {
    var dataString = data;
  
    var options = {
      host: endpoint,
      port: 443,
      path: path,
      method: method,
      headers: headers
    };

    var req = https.request(options, function(res) {
        res.setEncoding('utf-8');
    
        var responseString = '';
    
        res.on('data', function(data) {
            responseString += data;
        });
    
        res.on('end', function() {
            //console.log(responseString);
            success(responseString);
        });
    });

    req.write(dataString);
    req.end();
} 
```

상세한 코드는 [github code](https://github.com/kyopark2014/aws-security-token-service/blob/main/client/client-url.js)를 참조합니다.

아래와 같이 client를 node로 실행합니다.

$ node client-url.js



## Lambda 함후 URL Drawback

Lambda 함수 URL은 Custom URL을 생성할 수 없고, WAF나 Shield와 같은 Security를 사용할 수 없습니다. CloudFront을 이용하여 이를 해결할 수 있으나 API Gateway를 제거하여 얻어진 장점이 사라집니다. 

따라서, Lambda 함수 URL의 특성에 맞게 간단하고 Private한 용도로 쓰거나, Internal 에서 유용하게 사용 하는것을 추천 드립니다 .

Lambda 함수 URL은 API Gateway의 Lambda proxy Integration처럼 동작하므로, 클라이언트가 다른 경로(Resource)나 POST/GET등 다른 method를 쓰더라도 모두 Lambda 함수에서 처리하게 됩니다. 
Lambda 함수 URL로 파일 전송시에 Lambda의 payload (https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)는 6MB까지 가능하여, API Gateway의 Payload (https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html)인 10MB에 비하여 상대적으로 적습니다. 


## Reference 
  
[Function URL](https://docs.aws.amazon.com/cdk/api/v1/docs/aws-lambda-readme.html#function-url)

  
[Lambda function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html?icmpid=docs_lambda_help)
    
[Build a REST API with API Gateway, AWS Lambda, DynamoDB & AWS CDK](https://faun.pub/build-a-rest-api-with-api-gateway-aws-lambda-dynamodb-aws-cdk-616d1e17c128)

[AWS STS를 이용한 Temparary security credential 활용하기](https://github.com/kyopark2014/aws-security-token-service)

[AWS Lambda Function URL 발표 – 단일 기능 마이크로서비스용 내장 HTTPS 엔드포인트(Alex Casalboni)](https://aws.amazon.com/ko/blogs/korea/announcing-aws-lambda-function-urls-built-in-https-endpoints-for-single-function-microservices/)

[AWS Lambda: function URL is live!](https://lumigo.io/blog/aws-lambda-function-url-is-live/)

[The Pros and Cons of AWS Lambda Function URLs](https://levelup.gitconnected.com/the-pros-and-cons-of-aws-lambda-function-urls-5868c9dacf20)

[Introducing Lambda Function URLs](https://dev.to/aws-builders/introducing-lambda-function-urls-4ahd)


