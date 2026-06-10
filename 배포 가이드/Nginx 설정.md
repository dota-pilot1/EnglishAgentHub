# Nginx 설정

## 목적

`dxline-tallent.com`의 `/api/*` 라우팅을 BeautyBook 백엔드(`4101`)에서 EnglishAgentHub 백엔드(`4301`)로 교체한다. 도메인은 동일.

## 현재 (BeautyBook)

```nginx
server {
    server_name dxline-tallent.com;
    location /api/ {
        proxy_pass http://127.0.0.1:4101;
        ...
    }
}
```

## 변경 후 (EnglishAgentHub)

```nginx
server {
    server_name dxline-tallent.com;
    listen 80;

    # /api/* → EnglishAgentHub
    location /api/ {
        proxy_pass http://127.0.0.1:4301;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;         # SSE/스트리밍용
        proxy_read_timeout 300s;     # 긴 응답 대비
    }

    # Swagger / OpenAPI (선택)
    location /swagger-ui/ {
        proxy_pass http://127.0.0.1:4301;
        proxy_set_header Host $host;
    }
    location /v3/api-docs {
        proxy_pass http://127.0.0.1:4301;
        proxy_set_header Host $host;
    }
}
```

> CloudFront가 앞단에서 HTTPS를 종료하고 EC2엔 HTTP(80)로 origin 요청을 보낸다.
> 그래서 Nginx 자체 SSL 설정은 필요 없다 (BeautyBook도 동일).

## 적용

EC2에서:

```bash
sudo nano /etc/nginx/sites-available/dxline-tallent.com   # (실제 경로는 BeautyBook 셋업 그대로)
# 위 블록의 4101 → 4301로 교체
sudo nginx -t
sudo systemctl reload nginx
```

## 검증

```bash
# 백엔드 직접
curl -sf http://127.0.0.1:4301/api/site-settings | head -c 200

# Nginx 경유 (EC2 내부)
curl -sf -H "Host: dxline-tallent.com" http://127.0.0.1/api/site-settings | head -c 200

# 외부 (HTTPS)
curl -sf https://dxline-tallent.com/api/site-settings | head -c 200
```

## 주의

- BeautyBook 백엔드는 `sudo systemctl stop beautybook && sudo systemctl disable beautybook`로 끈다 (제거하지 않는다).
- BeautyBook의 `4101`은 더 이상 쓰지 않는다. Nginx의 `proxy_pass`에 `4101`이 남아 있지 않은지 확인.
- WebSocket(예: `wss://`)가 필요한 경우 `proxy_set_header Upgrade`/`Connection` 추가. EnglishAgentHub는 OpenAI Realtime을 클라이언트 직접 연결로 처리하므로 Nginx 단에서 WS 프록시는 필요 없다.
- `proxy_buffering off`는 `/api/ai/chat/stream`(SSE) 청크 즉시 전달용. 빠뜨리면 답변이 한 번에 몰려서 스트리밍이 안 보인다.
