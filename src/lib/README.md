# Source Libraries (`src/lib`)

This directory contains the core business logic and utilities for SnapQuiz.

## Directory Structure

```
lib/
├── api/            # HTTP utilities and rate limiting
├── auth/           # Authentication (JWT, password hashing)
├── audio/          # Audio playback for podium animations
├── db/             # Prisma database client
├── llm/            # LLM providers for AI quiz generation
├── parsing/        # Document parsing (PDF, DOCX, PPTX)
├── realtime/       # Socket.IO event types and client hook
├── scoring/        # Quiz scoring algorithm
├── sessions/       # Game session management
├── types/          # Shared TypeScript types
├── utils.ts        # Utility functions (cn, etc.)
└── validation/     # Zod validation schemas
```

## Key Modules

### API (`api/`)

- **http.ts**: JSON response helpers, error responses
- **rateLimit.ts**: In-memory rate limiting for API endpoints

### Authentication (`auth/`)

- **middleware.ts**: `requireAuth()` middleware for protected routes
- **password.ts**: bcrypt password hashing and verification
- **token.ts**: JWT token generation and validation

### LLM (`llm/`)

AI quiz generation providers. See [llm/README.md](./llm/README.md).

- **client.ts**: Provider factory, API key encryption
- **providers/**: Azure AI Foundry, OpenAI, Anthropic
- **prompts.ts**: Quiz generation prompt templates
- **errors.ts**: LLM-specific error types

### Parsing (`parsing/`)

- **document.ts**: Parse PDF, DOCX, PPTX, TXT files for content extraction
- **url.ts**: Fetch and extract content from URLs

### Realtime (`realtime/`)

- **events.ts**: Socket.IO event types (question.started, lobby.updated, etc.)
- **client.ts**: `useSessionSocket()` React hook for real-time events

### Scoring (`scoring/`)

- **scoring.ts**: Points calculation based on correctness and speed

Formula: `Points = 1000 * (timeRemaining / timeLimit)`

### Sessions (`sessions/`)

- **sessionService.ts**: Create sessions, manage game flow, emit events
- **pin.ts**: Generate unique 6-digit session PINs
- **leaderboard.ts**: Calculate and format leaderboard data
- **results.ts**: Aggregate final quiz results

### Validation (`validation/`)

- **schemas.ts**: Zod schemas for quiz, session, participant data
- **authSchemas.ts**: Login, password change schemas
- **llmSchemas.ts**: LLM settings validation

## Best Practices

1. **Server-only**: These modules run on the server only (except `realtime/client.ts`)
2. **Type-safe**: All functions use TypeScript with strict typing
3. **Validated**: Input validation with Zod before processing
4. **Secure**: Sensitive data (API keys, passwords) are encrypted/hashed
