# Ravi — English Speaking Tutor

A speaking-practice web app: the learner talks out loud, an AI tutor replies in
natural conversation, corrects grammar mistakes, and gives pronunciation/fluency
tips — all voiced back using the browser's text-to-speech.

- **`frontend/`** — React + TypeScript (Vite). Handles the UI, microphone input
  and voice output via the browser's Web Speech API, and talks to the backend
  over HTTP.
- **`backend/`** — Java 17 + Spring Boot. A REST API that calls an LLM
  (via any OpenAI-compatible chat completions endpoint — this project runs on
  [Groq's free tier](https://console.groq.com) by default) to generate the
  tutor's replies, grammar corrections, and pronunciation tips.

By design, **nothing is persisted** — there's no login and no database. Each
browser session is a self-contained conversation held in React state; refreshing
the page starts a fresh conversation.

---

## How it works

1. The learner picks a topic and level in the sidebar and taps the mic button.
2. The browser's `SpeechRecognition` API transcribes their speech to text.
3. The transcript is sent to `POST /api/tutor/chat` along with the topic, level,
   and the conversation so far.
4. The Spring Boot backend builds a system prompt instructing the LLM to act as
   a tutor, and asks it for a strict JSON reply: `{ reply, correction,
   correctionExplanation, pronunciationTip }`.
5. The frontend renders the tutor's reply as a chat bubble, shows the correction
   and tip as small callouts under the learner's own message, and speaks the
   reply aloud with `SpeechSynthesis`.

```
┌─────────────┐   speech-to-text    ┌──────────────────┐   HTTPS JSON    ┌───────────────┐
│   Browser   │ ──────────────────▶ │  React frontend  │ ──────────────▶ │ Spring Boot   │
│  mic / TTS  │ ◀────────────────── │   (Vite, :5173)  │ ◀────────────── │  API (:8080)  │
└─────────────┘   text-to-speech    └──────────────────┘                 └───────┬───────┘
                                                                                  │ chat completions
                                                                                  ▼
                                                                          ┌───────────────┐
                                                                          │  LLM provider │
                                                                          │ (Groq, free)  │
                                                                          └───────────────┘
```

---

## Project structure

```
english-tutor/
├── backend/                         Spring Boot API
│   ├── pom.xml
│   └── src/main/java/com/englishtutor/
│       ├── EnglishTutorApplication.java
│       ├── config/                  CORS + WebClient + LLM settings binding
│       ├── controller/              TutorController — /api/tutor/*
│       ├── dto/                     Request/response records
│       ├── service/                 TutorService, LlmClient (calls the LLM)
│       └── exception/               Global JSON error handling
│
└── frontend/                        React + TypeScript app
    └── src/
        ├── api/tutorApi.ts          Fetch wrapper for the backend
        ├── hooks/                   useSpeechRecognition, useSpeechSynthesis
        ├── components/              Tutor, TopicSelector, ConversationView, …
        └── types.ts
```

---

## Prerequisites

- **Java 17+** and **Maven** — for the backend (`java -version`, `mvn -version`)
- **Node.js 18+** — for the frontend (`node -version`)
- A free **Groq** API key (or any other OpenAI-compatible provider/key)
- **Chrome or Edge** to run the app in — best Web Speech API support

---

## Getting a free API key (Groq)

1. Go to [console.groq.com](https://console.groq.com) and sign up — no credit
   card required.
2. Open **API Keys** in the sidebar → **Create API Key** → copy it immediately
   (it's shown once).
3. Groq occasionally retires model names — check
   [console.groq.com/docs/models](https://console.groq.com/docs/models) if a
   model ID in this README ever stops working, and swap in whatever's current.

---

## Running it locally

### 1. Backend (Spring Boot)

```bash
cd backend
```

Set these environment variables in the same terminal before starting the app:

**PowerShell**
```powershell
$env:LLM_API_KEY="gsk_your_key_here"
$env:LLM_BASE_URL="https://api.groq.com/openai/v1"
$env:LLM_MODEL="openai/gpt-oss-20b"
```

**Command Prompt**
```cmd
set LLM_API_KEY=gsk_your_key_here
set LLM_BASE_URL=https://api.groq.com/openai/v1
set LLM_MODEL=openai/gpt-oss-20b
```

**macOS/Linux**
```bash
export LLM_API_KEY=gsk_your_key_here
export LLM_BASE_URL=https://api.groq.com/openai/v1
export LLM_MODEL=openai/gpt-oss-20b
```

Then run:
```bash
mvn spring-boot:run
```

The API starts on **http://localhost:8080**. Environment variables reference
(see `src/main/resources/application.yml`):

| Variable                | Default                          | Purpose                                    |
|-------------------------|-----------------------------------|---------------------------------------------|
| `LLM_API_KEY`           | *(required)*                      | API key for your LLM provider               |
| `LLM_MODEL`             | `gpt-4o-mini`                      | Model name to request                       |
| `LLM_BASE_URL`          | `https://api.openai.com/v1`       | Any OpenAI-compatible chat completions API  |
| `CORS_ALLOWED_ORIGINS`  | `http://localhost:5173`           | Comma-separated frontend origin(s)          |

Without `LLM_API_KEY` set, `/api/tutor/chat` returns a clear `503` error
explaining the AI isn't configured, instead of failing silently.

> **Note:** the values above default to OpenAI. To use Groq's free tier
> (as this project is currently configured), you must set `LLM_BASE_URL` and
> `LLM_MODEL` as shown, not just `LLM_API_KEY`.

### 2. Frontend (React)

Open a **second terminal** (leave the backend running in the first):

```bash
cd frontend
cp .env.example .env   # points at http://localhost:8080/api by default
npm install
npm run dev
```

Open **http://localhost:5173** in Chrome or Edge, allow microphone access,
pick a topic, and tap the mic button.

---

## API reference

**`GET /api/tutor/topics`**
Returns the list of conversation topics and their opening greeting.

**`POST /api/tutor/chat`**
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
```json
{
  "reply": "That sounds nice! What did you buy at the market?",
  "correction": "Yesterday I went to the market",
  "correctionExplanation": "Use the past tense 'went' for things that already happened.",
  "pronunciationTip": null
}
```

**`GET /api/tutor/health`** — simple liveness check.

---

## Switching LLM providers

Because the backend calls a plain OpenAI-compatible `/chat/completions`
endpoint, switching providers is a config change only — no Java code edits
needed. Just update `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_API_KEY`:

| Provider | Free? | Base URL | Example model |
|---|---|---|---|
| Groq | Yes, no card | `https://api.groq.com/openai/v1` | `openai/gpt-oss-20b` |
| OpenAI | Paid | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Ollama (local) | Yes, always | `http://localhost:11434/v1` | whatever model you've pulled |

---

## Adding persistence later

Scope for this version intentionally excludes accounts and saved history. If
that changes, the natural next steps are:
- Add a `users` table + Spring Security/JWT for accounts
- Add a `conversations` / `messages` table (PostgreSQL) and a
  `ConversationController` to save/list past sessions
- Load a learner's history into the frontend on login instead of starting
  every session from a blank slate

None of the current API contracts would need to change for this — `history`
is already passed per-request, so the backend doesn't need to know whether it
came from React state or a database.

---

## Known limitations

- Speech recognition/synthesis quality depends entirely on the browser — this
  is a browser platform constraint, not something the app can control.
- The LLM call is synchronous; a slow provider response makes the learner
  wait. `LLM_TIMEOUT_SECONDS` caps this (default 20s) and surfaces a clean
  error rather than hanging.
- Free-tier LLM models occasionally get renamed or retired by the provider.
  If chat requests suddenly start failing with a 404, check the provider's
  current model list first.

---

## License

Private project. Not intended for public redistribution.
