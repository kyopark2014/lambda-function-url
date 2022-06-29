# Temperary Security Credential로 Lambda 함수 URL을 호출하는 Client 만들기 

[Temparary security credential 을 이용하여 Lambda Function URL 접속](https://github.com/kyopark2014/aws-security-token-service/blob/main/lambda-invation-using-temp-credential.md)에서는 Temperary security credential을 이용하여 Postman을 통해 Lambda 함수 URL에 접속하는 방법을 설명하고 있습니다. 하지만, 이러한 방법으로 Postman에 매번 Temparary security credential을 생성하여 넣는 것은 매우 번거로우므로, Client 직접 Temperary security credential을 생성하고 request를 보낼 수 있어야 합니다. 이것은 [Signing AWS requests with Signature Version 4](https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html)을 이용하여 [Crypto로 직접 인증을 수행](https://github.com/kyopark2014/aws-security-token-service/tree/main/lambda-for-authentification-request-using-crypto)하거나, AWS SDK를 통해 구현이 가능합니다. 아래에서는 AWS SDK를 이용해서 temparary security credential을 생성하고, 이를 이용해 request를 singing하는 과정을 설명합니다. 


#### AWS SDK를 이용하여 temparary security credential 생성

상기의 기 생성한 Role을 가지고 아래와 같이 STS를 통해 Temperary security credential을 생성합니다. AWS CDK로 인프라 생성시 확인된, Lambda 함수 URL의 Endpoint 주소와 fnUrlRole의 Arn을 아래와 같이 업데이트 합니다. 

```java
const domain = 'atkqt4btjeqnh3sarsdd5rhklm0mftdy.lambda-url.ap-northeast-2.on.aws';
const roleArn = 'arn:aws:iam::677146750822:role/CdkLambdaStack-fnUrlRoleF3FB2EB9-1GN82O6QTTIND'
```

이제 아래와 같이 [AWS STS](https://docs.aws.amazon.com/ko_kr/IAM/latest/UserGuide/id_credentials_temp.html) 를 접속하여 Temperary security credential을 가져온 후에 AWS config에 업데이트를 합니다. 

```java
    const params = {
        RoleArn: roleArn,
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

    aws.config.credentials.accessKeyId = data.Credentials.AccessKeyId;
    aws.config.credentials.sessionToken = data.Credentials.SessionToken;
    console.log("credentials: %j", aws.config.credentials);
```

새로운 credential로 AWS의 Config를 업데이트 합니다.

```java
    aws.config.credentials.accessKeyId = data.Credentials.AccessKeyId;
    aws.config.credentials.sessionToken = data.Credentials.SessionToken;
    console.log("modified credentials: %j", aws.config.credentials);
```

이제 http request를 sign 한후 request에 대한 signature를 구합니다. 이후 아래와 같이 request를 Lambda 함수 URL의 Endpoint로 보내면 RESTful 기반의 API를 구현 할 수 있습니다.  상세한 코드는 [github](https://github.com/kyopark2014/lambda-function-url/blob/main/client/client-get.js)을 참조합니다.


```java
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
    
    // request
    performRequest(domain, signedRequest.headers, signedRequest.body, myPath, myMethod, function(response) {    
        console.log('response: %j', response);
    });
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


아래와 같이 client를 node로 실행합니다.

$ node client-get.js


