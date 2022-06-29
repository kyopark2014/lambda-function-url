var aws = require('aws-sdk');

const dynamo = new aws.DynamoDB.DocumentClient();

const tableName = process.env.tableName;

exports.handler = async (event) => {
    console.log('event: '+JSON.stringify((event)));

    const method = event['requestContext']['http']['method'];
    console.log('method: '+method);

    let results = [];

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
    else if(method == 'POST') {
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

    console.log("results: "+results);

    const response = {
        statusCode: 200,
        body: results
    };
    return response;
};

