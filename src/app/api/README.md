# API Routes

This directory contains all Next.js API routes for SnapQuiz.

## Route Structure

```
api/
├── auth/                    # Authentication
│   ├── setup/route.ts       # POST - Initial password setup
│   ├── login/route.ts       # POST - Login
│   ├── logout/route.ts      # POST - Logout
│   ├── status/route.ts      # GET - Check auth status
│   └── change-password/route.ts  # POST - Change password
│
├── llm/                     # LLM Settings
│   ├── settings/route.ts    # GET/PUT - Manage LLM configuration
│   └── test-connection/route.ts  # POST - Test LLM provider
│
├── quizzes/                 # Quiz Management
│   ├── route.ts             # GET/POST - List/Create quizzes
│   ├── [quizId]/route.ts    # GET/PUT/DELETE - Single quiz CRUD
│   └── generate/
│       ├── route.ts         # POST - Generate from topic
│       ├── document/route.ts # POST - Generate from file upload
│       └── url/
│           ├── route.ts     # POST - Generate from URL
│           └── check/route.ts # POST - Validate URL
│
├── sessions/                # Live Game Sessions
│   ├── route.ts             # POST - Create session
│   ├── [sessionId]/
│   │   ├── route.ts         # GET/DELETE - Session details
│   │   ├── join/route.ts    # POST - Player joins session
│   │   ├── answer/route.ts  # POST - Submit answer
│   │   └── control/route.ts # POST - Host control actions
│   └── by-pin/
│       └── [pin]/route.ts   # GET - Find session by PIN
│
└── dev/                     # Development/Demo endpoints
    ├── demo-session/route.ts    # POST - Create demo session
    └── demo-control/route.ts    # POST - Control demo session
```

## Authentication

Most `/api/quizzes/*` and `/api/sessions/*` endpoints require host authentication via JWT cookie.

```typescript
// In your route handler:
import { requireAuth } from "@/lib/auth/middleware";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth; // Unauthorized
  
  // Proceed with authenticated request...
}
```

## Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Rate Limited |
| 500 | Server Error |

## Rate Limiting

Endpoints are rate-limited to prevent abuse:

| Endpoint Pattern | Limit |
|-----------------|-------|
| `/api/auth/*` | 10 req/min |
| `/api/quizzes/generate/*` | 5 req/min |
| `/api/sessions/*/answer` | 60 req/min |

## Control Actions

The `/api/sessions/[sessionId]/control` endpoint accepts these actions:

| Action | Description |
|--------|-------------|
| `start_game` | Start the quiz from lobby |
| `next_question` | Advance to next question |
| `reveal_answer` | Show correct answer |
| `show_leaderboard` | Display current standings |
| `end_game` | End the session |
