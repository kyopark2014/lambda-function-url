# Lambda Function URL

여기에서는 Lambda Function URL에 대해 이해하고, [AWS CDK](https://github.com/kyopark2014/technical-summary/blob/main/cdk-introduction.md)로 Lambda funtion url을 생성하고 활용하는것에 대한 예제를 보여줍니다. 또한 Lambda funtional url의 보안을 IAM을 통해 수행되고 이를 위해 client에서 temperary security credential을 이용한 접속 방법도 가이드 합니다. 

## Lambda 함수 URL 이란?

AWS의 대표적인 서비리스 서비스인 Lambda는 인프라에 대한 고민없이 개발에만 집중할 수 있어 편리하며, Concurrency에 기반한 오토 스케일링으로 부하의 변동에 쉽게 대응할 수 있으며, 사용하지 않을 경우에는 비용이 발생하지 않아서 경제적입니다. 하지만 그동안 외부에서 Lambda를 직접 호출 할 수 없어, API Gateway를 Endpoint로 사용하여야 했습니다. API Gateway는 다양한 인증과 편리한 기능을 제공하나, 하나 또는 소수의 API를 간단히 구현하여 Private하게 사용하는 경우에도 API Gateway를 사용하여야 했습니다. 아래 그림은 [일반적인 serverless architecture](https://faun.pub/build-a-rest-api-with-api-gateway-aws-lambda-dynamodb-aws-cdk-616d1e17c128)로서, DynamoDB를 조회하는 Lambda 함수를 위하여 API Gateway를 사용하고 있습니다. 

![image](https://user-images.githubusercontent.com/52392004/171417037-0d2f02a3-a09a-4e80-9ab5-5d993b2b9dc9.png)

[AWS Lambda 함수 URL](https://aws.amazon.com/ko/about-aws/whats-new/2022/04/aws-lambda-function-urls-built-in-https-endpoints/)이 2022년 4월에 상용 적용됨으로 인해, API Gateway없이 Lambda를 HTTPS 엔드포인트로 사용할 수 있게 되었습니다. 아래 그림은 Lambda 함수 URL을 통해 DynamoDB를 조회하는 Architecture를 보여줍니다. 여기서, API Gateway 없이 Lambda로 직접 접속할 수 있어서 간단하고 편리하게 API를 제공 할 수 있습니다. 

![image](https://user-images.githubusercontent.com/52392004/171504682-3599dbdf-3043-4657-9cf0-fceab7901a42.png)



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

 
## Lambda 함수 URL을 호출하는 Client 만들기

[Lambda 함수 URL을 호출하는 Client 만들기](https://github.com/kyopark2014/lambda-function-url/tree/main/client)에서는 Temperary Security Credential을 이용하여 안전하게 Lambda 함수 URL을 호출하는 Cliet에 대해 설명합니다. 

## Lambda 함수 URL Drawback

Lambda 함수 URL은 Custom URL을 생성할 수 없고, WAF나 Shield와 같은 Security를 사용할 수 없습니다. CloudFront을 이용하여 이를 해결할 수 있으나 API Gateway를 제거하여 얻어진 장점이 사라집니다. 

따라서, Lambda 함수 URL의 특성에 맞게 간단하고 Private한 용도로 쓰거나, Internal 에서 유용하게 사용 하는것을 추천 드립니다 .

Lambda 함수 URL은 API Gateway의 Lambda proxy Integration처럼 동작하므로, 클라이언트가 다른 경로(Resource)나 POST/GET등 다른 method를 쓰더라도 모두 Lambda 함수에서 처리하게 됩니다. 
Lambda 함수 URL로 파일 전송시에 [Lambda의 payload](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)는 6MB까지 가능하여, [API Gateway의 Payload](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html)인 10MB에 비하여 상대적으로 적습니다. 


## Reference 
  
[Function URL - CDK](https://docs.aws.amazon.com/cdk/api/v1/docs/aws-lambda-readme.html#function-url)

  
[Lambda function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html?icmpid=docs_lambda_help)
    
[Build a REST API with API Gateway, AWS Lambda, DynamoDB & AWS CDK](https://faun.pub/build-a-rest-api-with-api-gateway-aws-lambda-dynamodb-aws-cdk-616d1e17c128)

[AWS STS를 이용한 Temparary security credential 활용하기](https://github.com/kyopark2014/aws-security-token-service)

[Announcing AWS Lambda Function URLs: Built-in HTTPS Endpoints for Single-Function Microservices](https://aws.amazon.com/ko/blogs/aws/announcing-aws-lambda-function-urls-built-in-https-endpoints-for-single-function-microservices/)

[AWS Lambda: function URL is live!](https://lumigo.io/blog/aws-lambda-function-url-is-live/)

[The Pros and Cons of AWS Lambda Function URLs](https://levelup.gitconnected.com/the-pros-and-cons-of-aws-lambda-function-urls-5868c9dacf20)

[Introducing Lambda Function URLs](https://dev.to/aws-builders/introducing-lambda-function-urls-4ahd)


