# English Speaking Tutor

An AI-powered English speaking practice web application that helps learners improve their English through interactive conversations, grammar corrections, pronunciation tips, and voice-based interaction.

## Live Demo

**Frontend:** https://ravi16329.github.io/English-Teacher/

**Backend:** https://english-teacher-b1a7.onrender.com

> The backend is hosted on Render's free tier and may take a short time to wake up after a period of inactivity.

---

## Features

- AI-powered English conversation practice
- Topic and difficulty-level selection
- Speech-to-text using the browser microphone
- AI-generated grammar corrections with explanations
- Pronunciation and fluency tips
- Text-to-speech for AI responses
- Interactive chat interface
- No login and no database — conversation state is kept in memory for the current browser session only

---

## Technology Stack

**Frontend:** React, TypeScript, Vite, Web Speech API

**Backend:** Java 17, Spring Boot 3 (Web, WebFlux, Validation), Maven, REST API

**AI:** Groq API (OpenAI-compatible Chat Completions), model `openai/gpt-oss-20b`

**Deployment:** GitHub Pages (frontend) + GitHub Actions, Render (backend, via Docker)

---

## How It Works

1. The learner selects a conversation topic and difficulty level.
2. The learner speaks using the microphone; the browser's Speech Recognition API converts speech to text.
3. The frontend sends the text and conversation history to the Spring Boot backend.
4. The backend builds a tutor prompt and sends it to the Groq AI model.
5. The AI generates a tutor reply, a grammar correction, a correction explanation, and a pronunciation tip.
6. The backend returns this to the frontend, which displays it and reads the reply aloud with Speech Synthesis.

```text
                    USER
                     │
                     ▼
            ┌─────────────────┐
            │  React Frontend │
            │  GitHub Pages   │
            └────────┬────────┘
                      │ HTTPS
                      ▼
            ┌─────────────────┐
            │ Spring Boot API │
            │     Render      │
            └────────┬────────┘
                      │ Chat Completions
                      ▼
            ┌─────────────────┐
            │    Groq LLM     │
            └─────────────────┘
```

---

## Project Structure

The frontend lives at the repository root; the backend is in `backend/`.

```text
English-Teacher/
│
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/englishtutor/
│       │   ├── EnglishTutorApplication.java
│       │   ├── config/          CorsConfig, LlmProperties, WebClientConfig
│       │   ├── controller/      TutorController — /api/tutor/*
│       │   ├── dto/             ChatRequest, ChatResponse, MessageDto, TopicDto
│       │   ├── service/         LlmClient, TutorService
│       │   └── exception/       ApiException, GlobalExceptionHandler
│       └── resources/
│           └── application.yml
│
├── src/
│   ├── api/tutorApi.ts
│   ├── components/              ConversationView, MessageBubble, StatusBar, TopicSelector, Tutor
│   ├── hooks/                   useSpeechRecognition, useSpeechSynthesis
│   ├── App.tsx / App.css
│   ├── index.css / main.tsx
│   ├── types.ts
│   └── vite-env.d.ts
│
├── package.json
├── vite.config.ts
├── index.html
└── .github/workflows/deploy.yml
```

---

## Prerequisites

- Java 17+ and Maven (`java -version`, `mvn -version`)
- Node.js 18+ and npm (`node -version`, `npm -version`)
- Git
- A free Groq API key (or any other OpenAI-compatible provider/key)
- Google Chrome or Microsoft Edge — best Web Speech API support

---

## Running the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/Ravi16329/English-Teacher.git
cd English-Teacher
```

### 2. Run the backend

```bash
cd backend
```

Set these environment variables in the same terminal before starting the app.

**PowerShell**
```powershell
$env:LLM_API_KEY="gsk_your_key_here"
$env:LLM_BASE_URL="https://api.groq.com/openai/v1"
$env:LLM_MODEL="openai/gpt-oss-20b"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173"
```

**Command Prompt**
```cmd
set LLM_API_KEY=gsk_your_key_here
set LLM_BASE_URL=https://api.groq.com/openai/v1
set LLM_MODEL=openai/gpt-oss-20b
set CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**macOS/Linux**
```bash
export LLM_API_KEY="gsk_your_key_here"
export LLM_BASE_URL="https://api.groq.com/openai/v1"
export LLM_MODEL="openai/gpt-oss-20b"
export CORS_ALLOWED_ORIGINS="http://localhost:5173"
```

Then start Spring Boot:

```bash
mvn spring-boot:run
```

The backend runs on **http://localhost:8080**. Keep this terminal running.

> Without `LLM_API_KEY` set, `/api/tutor/chat` returns a clear `503` error explaining the AI isn't configured, instead of failing silently.

### 3. Run the frontend

Open a **second terminal**, staying at the project root:

```bash
cd English-Teacher
npm install
npm run dev
```

The frontend runs on **http://localhost:5173**. Open it in Chrome or Edge and allow microphone access when prompted.

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `LLM_API_KEY` | *(required)* | API key for your LLM provider |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | Any OpenAI-compatible chat completions endpoint |
| `LLM_MODEL` | `gpt-4o-mini` | Model name to request |
| `LLM_PROVIDER` | — | LLM provider identifier |
| `LLM_TIMEOUT_SECONDS` | `20` | Max time to wait for an LLM response before returning a clean error |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated frontend origin(s) allowed to call the backend |

Example:

```env
LLM_API_KEY=gsk_your_key_here
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-20b
LLM_PROVIDER=openai
LLM_TIMEOUT_SECONDS=20
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## Getting a Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com) and sign up — no credit card required.
2. Open **API Keys** in the sidebar → **Create API Key** → copy it immediately (it's shown once).
3. Groq occasionally retires model names — check [console.groq.com/docs/models](https://console.groq.com/docs/models) if a model ID here ever stops working, and swap in whatever's current.

---

## Switching LLM Providers

The backend calls a plain OpenAI-compatible `/chat/completions` endpoint, so switching providers is a config change only — no code edits needed. Just update `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_API_KEY`.

| Provider | Free? | Base URL | Example model |
|---|---|---|---|
| Groq | Yes, no card | `https://api.groq.com/openai/v1` | `openai/gpt-oss-20b` |
| OpenAI | Paid | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Ollama (local) | Yes, always | `http://localhost:11434/v1` | whatever model you've pulled |

---

## Security

- Never commit a real API key to GitHub — always use the placeholder `gsk_your_key_here` in docs, and keep real keys only in environment variables.
- The API key must stay on the backend; it should never be exposed in the React frontend.
- For production, the key is stored as an environment variable on the backend hosting platform (Render).

---

## API Reference

**`GET /api/tutor/topics`** — Returns the available conversation topics and their opening greeting.

**`POST /api/tutor/chat`**

Request:
```json
{
  "userText": "Yesterday I go to market",
  "topic": "daily-life",
  "level": "beginner",
  "history": [
    { "role": "assistant", "text": "Hello! How was your day today?" }
  ]
}
```

Response:
```json
{
  "reply": "That sounds nice! What did you buy at the market?",
  "correction": "Yesterday I went to the market.",
  "correctionExplanation": "Use the past tense 'went' for an action that happened yesterday.",
  "pronunciationTip": null
}
```

**`GET /api/tutor/health`** — Simple liveness check.

---

## Deployment

**Frontend** — Deployed to GitHub Pages at https://ravi16329.github.io/English-Teacher/. GitHub Actions automatically builds and deploys it on every push to `main`.

**Backend** — Deployed to Render (Docker, Java 17) at https://english-teacher-b1a7.onrender.com, configured with `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_PROVIDER`, and `CORS_ALLOWED_ORIGINS`.

---

## Browser Support

Uses the browser's Web Speech API. For the best experience, use Google Chrome or Microsoft Edge. Microphone permission is required for speech recognition, and recognition/synthesis quality depends on the browser and operating system — this is a browser platform constraint, not something the app controls.

---

## Limitations

- No user authentication, no database — conversations are not permanently stored, and refreshing the page starts a new conversation.
- Speech recognition depends on browser support.
- The LLM call is synchronous, so a slow provider response makes the learner wait (capped by `LLM_TIMEOUT_SECONDS`).
- The Render free-tier backend may take some time to wake up after inactivity.
- Free-tier AI models and limits may change over time — if chat requests suddenly start failing with a 404, check the provider's current model list first.

---

## Future Improvements

- User authentication and profiles
- Persistent conversation history (e.g. a `users` table + Spring Security/JWT, a `conversations`/`messages` table in PostgreSQL)
- Progress tracking, vocabulary tracking, pronunciation scoring, speaking performance analytics
- Multiple AI model support
- Mobile application

The current API is already designed for this: `history` is passed per request, so the backend doesn't need to know whether it came from React state or a database.

---

## License

Private project. Not intended for public redistribution.
