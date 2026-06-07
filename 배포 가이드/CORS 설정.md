# CORS 설정

## 현재 상태

EnglishAgentHub 백엔드는 현재 CORS 허용 origin이 코드에 하드코딩되어 있다.

```java
config.setAllowedOrigins(List.of("http://localhost:4300"));
```

파일:

```text
english-agent-hub-server/src/main/java/com/cj/englishagenthub/config/SecurityConfig.java
```

운영 도메인으로 배포하려면 `https://english.dxline-tallent.com`을 허용해야 한다.

## 권장 수정

`application.yaml`에 설정값을 추가한다.

```yaml
cors:
  allowed-origin: ${ALLOWED_ORIGIN:http://localhost:4300}
```

`SecurityConfig`에서 환경값을 읽는다.

```java
@Value("${cors.allowed-origin:http://localhost:4300}")
private String allowedOrigin;
```

그리고 CORS 설정을 아래처럼 바꾼다.

```java
config.setAllowedOrigins(Arrays.stream(allowedOrigin.split(","))
        .map(String::trim)
        .filter(origin -> !origin.isBlank())
        .toList());
```

운영 `.env`:

```env
ALLOWED_ORIGIN=https://english.dxline-tallent.com
```

개발과 운영을 함께 허용할 때:

```env
ALLOWED_ORIGIN=https://english.dxline-tallent.com,http://localhost:4300
```

## 검증

```bash
curl -i -X OPTIONS \
  -H "Origin: https://english.dxline-tallent.com" \
  -H "Access-Control-Request-Method: POST" \
  https://english.dxline-tallent.com/api/auth/login
```

정상 응답에는 아래 헤더가 있어야 한다.

```text
Access-Control-Allow-Origin: https://english.dxline-tallent.com
Access-Control-Allow-Credentials: true
```

## 주의

- `allowCredentials(true)`를 사용하므로 `allowedOrigins("*")`는 쓰면 안 된다.
- 같은 EC2를 쓰더라도 브라우저 기준 origin이 다르면 CORS 대상이다.
- 프론트 `NEXT_PUBLIC_API_URL`과 백엔드 `ALLOWED_ORIGIN`을 같은 운영 도메인 기준으로 맞춘다.
