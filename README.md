# SnapQuiz 🎯

A real-time live quiz game application inspired by Kahoot, built with Next.js 15 and Socket.IO.

## ✨ Features

- **Live Quiz Sessions**: Host real-time quiz games with multiple participants
- **6-Digit PIN System**: Players join using a simple PIN code
- **QR Code Join**: Scan to join instantly from mobile devices
- **Real-time Updates**: Live participant list, answer tracking, and leaderboards
- **Timer with Auto-Reveal**: Configurable question timers with automatic answer reveal
- **Scoring System**: Points based on correctness and response speed
- **Presenter View**: Full-screen display for projectors/screens
- **Mobile-Friendly Player View**: Optimized for phones and tablets
- **AI Quiz Generation**: Generate quizzes from topics, documents, or URLs
- **Animated Podium**: Celebration sequence with confetti for top 3 players

## 🤖 AI Quiz Generation

SnapQuiz includes AI-powered quiz generation that allows you to create quizzes from:

### Sources
- **Topics**: Enter any subject (e.g., "World War II", "Photosynthesis")
- **Documents**: Upload PDF, DOCX, PPTX, or TXT files (max 10MB)
- **URLs**: Paste a link to an article or webpage

### Supported LLM Providers

| Provider | Description |
|----------|-------------|
| **Azure AI Foundry** | Azure-hosted models (Mistral, DeepSeek, GPT-5.2) |
| **OpenAI** | GPT-4o, GPT-4o-mini |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus |

### Setup
1. Go to **Settings** (`/host/settings`)
2. Select your AI provider
3. Enter your API endpoint and API key
4. For Azure AI Foundry: select the deployed model
5. Test the connection and save

### Usage
1. Go to **Create Quiz** (`/host/quizzes/new`)
2. Choose "Generate with AI"
3. Select your source type and enter content
4. Choose question count (1-20) and difficulty (Easy/Medium/Hard)
5. Select language (English or French)
6. Click "Generate Questions"
7. Review, edit time limits (15-120s presets), and save

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Real-time**: Socket.IO
- **Validation**: Zod
- **Testing**: Vitest + Playwright

## 📁 Project Structure

```
snapquiz/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Demo data seeder
│   └── migrations/        # Database migrations
├── public/
│   └── audio/podium/      # Audio assets for podium celebration
├── server.ts              # Custom server with Socket.IO
├── src/
│   ├── app/
│   │   ├── (host)/        # Host routes (presenter, quiz management)
│   │   │   ├── host/quizzes/       # Quiz CRUD pages
│   │   │   ├── host/settings/      # LLM & app settings
│   │   │   └── presenter/[sessionId]/ # Live presenter view
│   │   ├── (player)/      # Player routes
│   │   │   ├── join/      # Join page with PIN input
│   │   │   └── play/[sessionId]/ # Player game view
│   │   └── api/           # API routes
│   │       ├── auth/      # Authentication endpoints
│   │       ├── llm/       # LLM settings & test connection
│   │       ├── quizzes/   # Quiz CRUD & AI generation
│   │       └── sessions/  # Session management endpoints
│   ├── components/
│   │   ├── auth/          # Login, setup forms
│   │   ├── game/          # Game-specific components
│   │   ├── settings/      # LLM settings panel
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # Custom React hooks
│   └── lib/
│       ├── api/           # HTTP utilities, rate limiting
│       ├── auth/          # JWT, password hashing
│       ├── audio/         # Podium audio management
│       ├── db/            # Prisma client
│       ├── llm/           # LLM providers (Azure, OpenAI, Anthropic)
│       ├── parsing/       # Document parsing (PDF, DOCX, etc.)
│       ├── realtime/      # Socket.IO events & client hook
│       ├── scoring/       # Points calculation
│       ├── sessions/      # Session service & game logic
│       ├── types/         # TypeScript types
│       └── validation/    # Zod schemas
├── scripts/
│   ├── reset-password.ts  # Reset host password
│   └── clear-db.ts        # Clear database
└── tests/
    ├── unit/              # Unit tests
    └── e2e/               # End-to-end tests
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (x64 recommended for Prisma compatibility)
- npm or pnpm

### Installation

1. **Clone and install dependencies**
   ```bash
   cd snapquiz
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # Required for AI quiz generation
   LLM_KEY_ENCRYPTION_SECRET=<32-byte-hex-string>
   
   # Optional: For HTTPS cookies (ngrok, production)
   USE_HTTPS_COOKIES=true
   ```

   Generate an encryption secret:
   ```bash
   openssl rand -hex 32
   # Or on PowerShell:
   # [BitConverter]::ToString((1..32 | ForEach-Object { Get-Random -Max 256 })) -replace '-',''
   ```

4. **Initialize database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   - Host: http://localhost:3000/host/quizzes
   - Join: http://localhost:3000/join

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
# Or with environment variables on PowerShell:
$env:NODE_ENV="production"; npx tsx server.ts
```

## 🎮 How to Use

### As a Host

1. Go to `/host/quizzes` to see your quizzes
2. Create a new quiz manually or generate with AI
3. Click "Start Live Session" to create a game
4. Share the PIN with players or display QR code
5. Click "Start Game" when ready
6. Control the game flow with the presenter controls

### As a Player

1. Go to `/join` or scan the QR code
2. Enter the 6-digit PIN
3. Choose a nickname
4. Wait for the host to start
5. Answer questions as fast as you can!

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/setup` | Initial password setup |
| POST | `/api/auth/login` | Login with password |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/status` | Check auth status |
| POST | `/api/auth/change-password` | Change password |

### Quizzes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quizzes` | List all quizzes |
| POST | `/api/quizzes` | Create a quiz |
| GET | `/api/quizzes/[id]` | Get quiz details |
| PUT | `/api/quizzes/[id]` | Update a quiz |
| DELETE | `/api/quizzes/[id]` | Delete a quiz |

### AI Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quizzes/generate` | Generate quiz from topic |
| POST | `/api/quizzes/generate/document` | Generate quiz from uploaded document |
| POST | `/api/quizzes/generate/url` | Generate quiz from URL |
| POST | `/api/quizzes/generate/url/check` | Validate URL accessibility |

### LLM Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/llm/settings` | Get LLM configuration |
| PUT | `/api/llm/settings` | Save LLM configuration |
| POST | `/api/llm/test-connection` | Test LLM connection |

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create a session |
| GET | `/api/sessions/[id]` | Get session details |
| GET | `/api/sessions/by-pin/[pin]` | Find session by PIN |
| POST | `/api/sessions/[id]/join` | Join as participant |
| POST | `/api/sessions/[id]/answer` | Submit an answer |
| POST | `/api/sessions/[id]/control` | Host control actions |

### Control Actions

- `start_game` - Start the quiz
- `next_question` - Move to next question
- `reveal_answer` - Show the correct answer
- `show_leaderboard` - Display current standings
- `end_game` - End the session

## 📡 Real-time Events

Events are broadcast via Socket.IO to all participants in a session:

| Event | Description |
|-------|-------------|
| `lobby.updated` | Participant count/list changed |
| `question.started` | New question displayed |
| `question.closed` | Answer submission closed |
| `answer.reveal` | Correct answer shown |
| `leaderboard.updated` | Scores updated |
| `game.ended` | Final results available |

## 🗃️ Database Schema

### Main Entities

- **Quiz**: Title and collection of questions
- **Question**: Prompt, options, time limit, media
- **AnswerOption**: Choice text and correctness flag
- **LiveSession**: Active game with PIN and status
- **Participant**: Player in a session
- **Response**: Answer submission with timing
- **Score**: Running total for leaderboard
- **HostCredential**: Password hash for host authentication
- **LLMSettings**: Encrypted API keys and LLM configuration

## 🔐 Security

### API Key Encryption

LLM API keys are encrypted using AES-256-GCM before storage:
- 256-bit encryption key from `LLM_KEY_ENCRYPTION_SECRET`
- Unique random IV (Initialization Vector) per encryption
- Authentication tag prevents tampering
- Keys are never logged or exposed

### Host Authentication

- Password-protected host interface
- JWT tokens in HTTP-only cookies
- Secure password hashing with bcrypt

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

## 📝 Development Notes

### Socket.IO Integration

The app uses a custom server (`server.ts`) to integrate Socket.IO with Next.js. The emitter is shared across Webpack bundles using `globalThis.__socketEmitter`.

### Scoring Algorithm

Points are calculated based on:
- Base points for correct answer: 1000
- Speed bonus: Up to 500 points (decreases linearly with time)
- Formula: `basePoints + speedBonus * (1 - elapsedTime / timeLimit)`

### Mobile Testing

For testing on mobile devices via ngrok:
```bash
# Start ngrok tunnel
ngrok http 3000

# Start server with HTTPS cookies enabled
$env:USE_HTTPS_COOKIES="true"; npm run dev
```

### Known Considerations

- Uses SQLite for simplicity (swap to PostgreSQL for production)
- Session PINs are 6-digit numbers, unique per active session
- Timer auto-reveal triggers when countdown reaches zero
- Azure AI Foundry uses OpenAI-compatible API format

## 📄 License

MIT

---

Built with ❤️ using Next.js, Socket.IO, and Prisma
