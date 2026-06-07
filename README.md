# EnglishAgentHub

Generated from the auth/RBAC boilerplate.

## Goal

EnglishAgentHub is an authenticated web app for talking with the OpenAI Realtime API through user-provided API keys. The app will keep the existing auth/admin/RBAC foundation and add:

- User-specific OpenAI API key management
- Realtime conversation sessions and transcript storage
- Customizable conversation profiles, prompts, and response style
- Kakao notification hooks so the service can start or notify conversations

## Initial Structure

```text
english-agent-hub-container/
├── english-agent-hub-server   # Spring Boot API, auth, RBAC, Realtime/Kakao backend modules
├── english-agent-hub-front    # Next.js UI, login/admin screens, conversation UI
├── docker-compose.yml         # PostgreSQL
└── README.md
```

## Suggested Domain Modules

Backend modules to add next:

- `credential`: encrypted per-user OpenAI API key storage
- `conversation`: conversations, messages, transcripts, and metadata
- `realtime`: server-side OpenAI Realtime session orchestration
- `agent_profile`: custom instructions, speaking style, model settings
- `kakao`: Kakao notification integration and inbound trigger handling

Frontend slices to add next:

- `entities/conversation`
- `entities/agent-profile`
- `features/realtime-chat`
- `features/api-key-settings`
- `features/kakao-notification-settings`

## Run

Create or update the root `.env` file before starting the backend:

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_CHAT_MODEL=gpt-5-mini
OPENAI_REALTIME_MODEL=gpt-realtime-2
OPENAI_REALTIME_VOICE=marin
```

```bash
docker compose up -d postgres
```

```bash
cd english-agent-hub-server
./gradlew bootRun
```

```bash
cd english-agent-hub-front
npm install
npm run dev
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:4300 |
| Backend API | http://localhost:4301 |
| Swagger | http://localhost:4301/swagger-ui/index.html |
| Postgres | localhost:5436/english_agent_hub |

## AI MVP Endpoints

- `POST /api/ai/chat`: Spring AI text chat for the selected learning agent.
- `POST /api/realtime/client-secret`: Server-side OpenAI Realtime client secret minting for browser WebRTC sessions.
