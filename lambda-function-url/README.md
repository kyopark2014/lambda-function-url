# Lambda Fucntion URL


## 초기화

DyanmoDB를 선언하고 table 이름은 CDK에서 받아서 사용합니다. 

```java
var aws = require('aws-sdk');

const dynamo = new aws.DynamoDB.DocumentClient();

const tableName = process.env.tableName;
```

## GET

HTTPS GET 요청을 받으면 DynamoDB를 scan하여 전체 리스트를 전달합니다. 

```java
    if(method == 'GET') {
        const queryParams = {
            TableName: tableName
        };

        var dynamoQuery; 
        try {
            dynamoQuery = await dynamo.scan(queryParams).promise();

            results = dynamoQuery.Items;
    
            console.log('queryDynamo: '+dynamoQuery.Count);   
        } catch (error) {
            console.log('Failure: '+error);
            return;
        } 
    }
```

## POST

HTTP POST로 json 형태의 document를 받으면 parsing하여 DynamoDB에 putItem 동작을 수행합니다. 

```java
    if(method == 'POST') {
        const body = Buffer.from(event['body'], 'base64');        
        console.log('body: '+body);
        const input = JSON.parse(body);

        // putItem to DynamoDB
        for(let i=0;i<input.length;i++) {            
            let putParams = {
                TableName: tableName,
                Item: {
                    "user-id": input[i]["user-id"],
                    "name": input[i]["name"],
                } 
            };
            console.log('%j', putParams);

            try {
                await dynamo.put(putParams).promise();
            } catch (error) {
                console.log('Failure: '+error);
            }   
        }
    }
```    
