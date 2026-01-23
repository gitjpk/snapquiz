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

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
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
├── server.ts              # Custom server with Socket.IO
├── src/
│   ├── app/
│   │   ├── (host)/        # Host routes (presenter, quiz management)
│   │   │   ├── host/quizzes/       # Quiz CRUD pages
│   │   │   └── presenter/[sessionId]/ # Live presenter view
│   │   ├── (player)/      # Player routes
│   │   │   ├── join/      # Join page with PIN input
│   │   │   └── play/[sessionId]/ # Player game view
│   │   └── api/           # API routes
│   │       ├── quizzes/   # Quiz CRUD endpoints
│   │       └── sessions/  # Session management endpoints
│   ├── components/
│   │   ├── game/          # Game-specific components
│   │   └── ui/            # shadcn/ui components
│   └── lib/
│       ├── db/            # Prisma client
│       ├── realtime/      # Socket.IO events & client hook
│       ├── scoring/       # Points calculation
│       ├── sessions/      # Session service & game logic
│       └── validation/    # Zod schemas
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

3. **Initialize database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Start development server**
   ```bash
   npx tsx server.ts
   ```

5. **Open in browser**
   - Host: http://localhost:3000/host/quizzes
   - Join: http://localhost:3000/join

## 🎮 How to Use

### As a Host

1. Go to `/host/quizzes` to see your quizzes
2. Click on a quiz to view/edit it
3. Click "Start Live Session" to create a game
4. Share the PIN with players
5. Click "Start Game" when ready
6. Control the game flow with the presenter controls

### As a Player

1. Go to `/join` or scan the QR code
2. Enter the 6-digit PIN
3. Choose a nickname
4. Wait for the host to start
5. Answer questions as fast as you can!

## 🔌 API Endpoints

### Quizzes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quizzes` | List all quizzes |
| POST | `/api/quizzes` | Create a quiz |
| GET | `/api/quizzes/[id]` | Get quiz details |
| PUT | `/api/quizzes/[id]` | Update a quiz |
| DELETE | `/api/quizzes/[id]` | Delete a quiz |

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

## ⚙️ Configuration

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Optional: API key for host endpoints
# HOST_API_KEY="your-secret-key"
```

## 🧪 Testing

```bash
# Run unit tests
npm test

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

### Known Considerations

- Uses SQLite for simplicity (swap to PostgreSQL for production)
- Session PINs are 6-digit numbers, unique per active session
- Timer auto-reveal triggers when countdown reaches zero

## 📄 License

MIT

---

Built with ❤️ using Next.js, Socket.IO, and Prisma
