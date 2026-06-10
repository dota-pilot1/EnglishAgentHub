# EnglishAgentHub 배포 가이드 (v2 — BeautyBook 인프라 인계)

이 폴더는 EnglishAgentHub를 운영하기 위한 배포 문서다.

## 전략: BeautyBook 인프라 전체 인계

BeautyBook은 운영 중단하고, 그 인프라(EC2/Nginx/Route 53/CloudFront/S3/ACM 인증서/도메인)를 **EnglishAgentHub가 그대로 사용**한다.

- 새 S3 버킷, 새 CloudFront, 새 서브도메인, 새 인증서를 만들 필요가 없다.
- DB만 별도 컨테이너로 추가하고, 백엔드는 새 systemd 서비스로 띄운다.
- 도메인 `dxline-tallent.com`은 EnglishAgentHub가 차지한다.

> BeautyBook 데이터(`beauty-book-postgres`)는 보존한다. 컨테이너는 살려두고 서비스(`beautybook.service`)와 Nginx 라우팅만 비활성화한다.

## 재사용 vs 신규

| 항목 | 처리 |
| --- | --- |
| EC2 인스턴스 (`13.209.195.64`) | ✅ 그대로 재사용 |
| Nginx | ✅ 같은 인스턴스, `server` 블록 라우팅만 4101 → 4301로 변경 |
| Route 53 (`dxline-tallent.com`) | ✅ 그대로 재사용 |
| ACM 인증서 (`dxline-tallent.com`) | ✅ 그대로 재사용 |
| CloudFront 배포 (`E11NF3HMOB52NI`) | ✅ 그대로 재사용 (origin S3는 동일, behavior 동일) |
| S3 버킷 (`beauty-book-hair-front`) | ✅ 그대로 재사용 (내용물만 EnglishAgentHub 빌드로 덮어쓰기) |
| BeautyBook systemd (`beautybook.service`) | 🔴 중지 + 비활성화 (보존) |
| BeautyBook DB (`beauty-book-postgres`) | 🟡 컨테이너 보존 (서비스만 중단) |
| **EnglishAgentHub DB** (`english-agent-hub-postgres`, 5436) | 🆕 새 컨테이너 추가 |
| **EnglishAgentHub 백엔드** (4301, `englishagenthub.service`) | 🆕 새 systemd 추가 |
| **`.env` 파일** | 🆕 신규 작성 |

## 문서 목록

```text
배포 가이드/
├── README.md             ← 지금 이 문서
├── 배포 체크리스트.md      ← 작업 순서 한눈에
├── 서버 정보.md            ← EC2/도메인/인증서/버킷 등 기준값
├── 아키텍처.md             ← 토폴로지 다이어그램
├── 백엔드 배포.md          ← EC2 작업 (Postgres 추가, systemd, env, JAR)
├── 프론트엔드 배포.md      ← 로컬 빌드, S3 sync, CloudFront 무효화
├── Nginx 설정.md           ← 4101 → 4301 전환
├── CORS 설정.md            ← ALLOWED_ORIGIN=https://dxline-tallent.com
└── .env.prod.example       ← 운영 환경변수 템플릿
```

## 기본 기준값

| 항목 | 값 |
| --- | --- |
| 도메인 | `https://dxline-tallent.com` |
| 백엔드 포트 | `4301` |
| 백엔드 systemd | `englishagenthub.service` |
| PostgreSQL 컨테이너 | `english-agent-hub-postgres` |
| PostgreSQL 포트 | `5436` |
| DB 이름 | `english_agent_hub` |
| 프론트 S3 버킷 | `beauty-book-hair-front` (그대로 재사용) |
| CloudFront 배포 ID | `E11NF3HMOB52NI` (그대로 재사용) |
| ACM 인증서 | BeautyBook용 그대로 재사용 |
| EC2 IP | `13.209.195.64` |

## 민감 파일 관리

```text
배포 가이드/
├── *.pem            ← Git에 올리지 않음
├── *.key            ← Git에 올리지 않음
├── *.csv            ← Git에 올리지 않음
└── .env.prod        ← Git에 올리지 않음 (.env.prod.example만 커밋)
```

`.gitignore`에 반영돼 있다.

## 시크릿 보관

운영 시크릿은 다음 두 곳에 **동일하게** 보관한다.

| 위치 | 용도 |
| --- | --- |
| EC2: `/home/ubuntu/english-agent-hub/.env` (퍼미션 600) | 런타임이 직접 읽는 파일 |
| 로컬: `배포 가이드/.env.prod` (퍼미션 600, .gitignore됨) | 백업·재배포용 |

### 시크릿 정책

- `JWT_SECRET`: 56바이트 이상. base는 `hyun0316!@-eah-prod-jwt-`(식별용) + 24자 랜덤(`openssl rand -base64 24` → URL-safe).
- `API_KEY_SECRET`: 56바이트 이상, JWT와는 **다른 값**. base는 `hyun0316!@-eah-prod-aes-` + 24자 랜덤.
  - ⚠️ **한 번 정하면 절대 변경 금지** — 저장된 사용자 OpenAI 키 복호화가 불가능해진다.
- `OPENAI_API_KEY`: 비워둠. 시스템 폴백 사용 안 함. 각 사용자가 프로필에서 본인 OpenAI 키를 등록한다.
- `ALLOWED_ORIGIN`: `https://dxline-tallent.com`.

### 시크릿 재배포

로컬 백업이 사라지지 않는 한 다시 만들 일이 없다. 백업이 사라졌고 EC2 `.env`만 살아있다면 EC2에서 `cat .env`로 그대로 백업한다 (절대 새로 만들지 않는다 — `API_KEY_SECRET`이 다르면 모든 사용자 OpenAI 키 못 푼다).
