# EnglishAgentHub 배포 가이드

이 폴더는 BeautyBook Hair 운영 EC2에 EnglishAgentHub를 함께 올리기 위한 배포 문서다.

## 권장 운영 방식

- EC2는 기존 BeautyBook 인스턴스를 공유한다.
- 백엔드, DB, systemd 서비스, 프론트 S3/CloudFront 경로는 분리한다.
- 비용 절감 목적은 EC2를 추가하지 않는 데 있다. S3 버킷은 별도로 만들어도 고정비 부담이 거의 없으므로 분리하는 편이 안전하다.
- BeautyBook의 `/api/* -> localhost:4101` 라우팅과 충돌하지 않도록 EnglishAgentHub는 별도 도메인 또는 서브도메인을 쓴다.

권장 도메인:

```text
https://english.dxline-tallent.com
```

## 문서 목록

```text
배포 가이드/
├── README.md
├── 서버 정보.md
├── 아키텍처.md
├── 백엔드 배포.md
├── 프론트엔드 배포.md
├── Nginx 설정.md
├── CORS 설정.md
├── 배포 체크리스트.md
└── .env.prod.example
```

## 현재 프로젝트 기준값

| 항목 | 값 |
| --- | --- |
| 프로젝트 루트 | `/Users/terecal/english-agent-hub-container` |
| 백엔드 | `english-agent-hub-server` |
| 프론트엔드 | `english-agent-hub-front` |
| 백엔드 포트 | `4301` |
| 프론트 로컬 포트 | `4300` |
| PostgreSQL 포트 | `5436` |
| DB 이름 | `english_agent_hub` |
| Docker 컨테이너 | `english-agent-hub-postgres` |
| systemd 서비스 | `englishagenthub.service` |
| 권장 S3 버킷 | `english-agent-hub-front` |
| 운영 API Base | `https://english.dxline-tallent.com` |

## 민감 파일 관리

다음 파일은 이 폴더에 두더라도 Git에 올리지 않는다.

- `*.pem`
- `*.key`
- `*.csv`
- `.env.prod`

`.gitignore`에 반영되어 있다.
