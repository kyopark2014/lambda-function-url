# AWS Console에서 Lambda 함수 URL 생성하기

Lambda 생성시 [Advanced settings]에서 [Enable function URL]을 생성하거나, 아래와 같이 Lambda Console에서 [Configuration] - [Function URL] - [Create function URL]에서 설정할 수 있습니다. 

![noname](https://user-images.githubusercontent.com/52392004/176203261-e8985359-6e7e-4d1e-988c-2b77b9a11d60.png)



Lambda 함수 URL을 Enable한 후, 아래와 같이 htts endpoint로 사용할 수 있는 URL을 알 수 있습니다.

![noname](https://user-images.githubusercontent.com/52392004/176204066-12890c3a-59b2-4615-bdc1-111ba4c571e8.png)



Lamdba 함수 URL은 아래와 같은 포맷이며, IPv4와 IPv6을 모두에서 https를 지원하고, cross-origin resource sharing (CORS)도 지원하고 있습니다. 

```c
https://<url-id>.lambda-url.<region>.on.aws
```
