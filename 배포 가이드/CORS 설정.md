# CORS 설정

## 목적

EnglishAgentHub 프론트는 `https://dxline-tallent.com`에서 서빙되고 API도 같은 도메인의 `/api/*`로 호출된다. **같은 도메인**이므로 사실 CORS는 발생하지 않는다.

다만 로컬 개발(`http://localhost:4300`)과 향후 도메인 변경에 대비해 백엔드는 `ALLOWED_ORIGIN` 환경변수로 허용 origin을 받는다.

## 백엔드 설정

`SecurityConfig` (또는 `WebMvcConfig`)는 다음 값을 읽도록 돼 있다.

```yaml
cors:
  allowed-origin: ${ALLOWED_ORIGIN:http://localhost:4300}
```

EC2 `.env`:

```env
ALLOWED_ORIGIN=https://dxline-tallent.com
```

쉼표로 여러 개를 줄 수 있다:

```env
ALLOWED_ORIGIN=https://dxline-tallent.com,http://localhost:4300
```

## 코드 위치 점검

> 가이드 작성 시점 기준 코드에서 `ALLOWED_ORIGIN`을 읽는지 확인 필요. 다른 이름으로 하드코딩돼 있다면 Spring Boot 재시작 전에 수정해 둔다.

확인 명령:

```bash
grep -rn "allowedOrigin\|ALLOWED_ORIGIN\|addAllowedOrigin" english-agent-hub-server/src/main/java
```

검색 결과가 비어 있으면 `SecurityConfig`(또는 별도 `WebConfig`)에 다음을 추가한다.

```java
@Bean
public CorsConfigurationSource corsConfigurationSource(
        @Value("${cors.allowed-origin:http://localhost:4300}") String allowedOrigin) {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(Arrays.stream(allowedOrigin.split(",")).map(String::trim).toList());
    cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setExposedHeaders(List.of("Authorization"));
    cfg.setAllowCredentials(true);
    cfg.setMaxAge(3600L);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
}
```

그리고 Security 필터 체인에서 `.cors(c -> c.configurationSource(corsConfigurationSource(...)))`.

## 검증

```bash
# preflight
curl -sI -X OPTIONS https://dxline-tallent.com/api/auth/login \
  -H "Origin: https://dxline-tallent.com" \
  -H "Access-Control-Request-Method: POST" | grep -i "access-control"

# 본 요청
curl -sI https://dxline-tallent.com/api/site-settings \
  -H "Origin: https://dxline-tallent.com" | grep -i "access-control"
```

응답에 `Access-Control-Allow-Origin: https://dxline-tallent.com`이 보이면 OK.

## 흔한 문제

- **`No 'Access-Control-Allow-Origin'`**: `.env`의 `ALLOWED_ORIGIN` 값에 끝 슬래시(`/`)가 들어가 있거나 `https` 누락. 정확히 `https://dxline-tallent.com`.
- **credentials 요청만 실패**: `allowCredentials=true`인데 `allowedOrigins`가 `*`이면 안 된다. 명시적 도메인만 허용.
- **로컬에서만 안 됨**: `.env`에 `,http://localhost:4300`을 추가해 두 origin 허용.
- **S3에서 직접 fetch하다 CORS 에러**: 그런 흐름이 없도록 만든다. 정적 파일은 CloudFront(`dxline-tallent.com`)에서만 서빙.
