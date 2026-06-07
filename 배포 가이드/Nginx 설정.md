# Nginx 설정

## 목적

기존 BeautyBook과 같은 EC2를 쓰되 도메인 기준으로 API를 분리한다.

```text
dxline-tallent.com/api/*          -> localhost:4101
english.dxline-tallent.com/api/*  -> localhost:4301
```

## HTTP 설정 예시

CloudFront가 HTTPS를 담당하고 EC2 원본으로 HTTP 요청을 보낼 경우의 예시다.

```nginx
server {
    listen 80;
    server_name english.dxline-tallent.com;

    location /api/ {
        proxy_pass http://127.0.0.1:4301;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

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

## HTTPS 직결 설정 예시

CloudFront를 쓰지 않고 `english.dxline-tallent.com`을 EC2로 직접 연결할 경우 Certbot 인증서가 필요하다.

```nginx
server {
    listen 443 ssl http2;
    server_name english.dxline-tallent.com;

    ssl_certificate /etc/letsencrypt/live/english.dxline-tallent.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/english.dxline-tallent.com/privkey.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:4301;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}

server {
    listen 80;
    server_name english.dxline-tallent.com;
    return 301 https://$host$request_uri;
}
```

## 적용

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 확인

```bash
curl -i http://127.0.0.1:4301/api/site-settings
curl -i http://english.dxline-tallent.com/api/site-settings
curl -i https://english.dxline-tallent.com/api/site-settings
```

## 주의

- 기존 BeautyBook의 `server_name dxline-tallent.com` 설정을 수정할 때 `/api/* -> 4101` 경로를 깨지 않는다.
- EnglishAgentHub는 별도 `server_name english.dxline-tallent.com` 블록으로 추가한다.
- 두 서비스가 같은 `/api/auth/login` 같은 경로를 갖기 때문에 같은 도메인에서 path만 공유하면 충돌한다.
