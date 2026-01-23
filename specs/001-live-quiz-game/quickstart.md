# Quickstart: Live Quiz Game Sessions (Next.js + SQLite)

**Branch**: 001-live-quiz-game  
**Date**: 2026-01-20  

This quickstart describes the local development workflow for SnapQuiz.

## Prerequisites

- Node.js 20 LTS or newer
- npm (or pnpm/yarn)

## Local Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:
   - `DATABASE_URL="file:./dev.db"` (SQLite database path)
   - `HOST_API_KEY=your-secret-host-key` (for host control endpoints)
   - `DEMO_API_KEY=your-demo-key` (for demo/dev endpoints)
   - `NEXT_PUBLIC_HOST_API_KEY=your-secret-host-key` (for client-side host calls)

3. **Initialize the database (Prisma)**

   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Create database and run migrations
   npx prisma migrate dev --name init
   
   # (Optional) Seed demo data
   npx prisma db seed
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   The server starts at `http://localhost:3000` with Socket.IO enabled.

5. **Run tests**

   ```bash
   # Unit tests (Vitest)
   npm run test
   
   # E2E tests (Playwright) - requires running server
   npm run test:e2e
   ```

## Quick Demo Flow

1. **Create a demo session**

   ```bash
   curl -X POST http://localhost:3000/api/dev/demo-session \
     -H "x-api-key: your-demo-key" \
     -H "Content-Type: application/json"
   ```

   Response includes `sessionId` and `pin`.

2. **Join as a player**
   - Open `http://localhost:3000/join` in a browser
   - Enter the 6-digit PIN and a nickname
   - Click Join

3. **Start the game (as host)**

   ```bash
   curl -X POST http://localhost:3000/api/dev/demo-control \
     -H "x-api-key: your-demo-key" \
     -H "Content-Type: application/json" \
     -d '{"sessionId": "YOUR_SESSION_ID", "action": "start_game"}'
   ```

4. **Control game flow**
   Available actions: `start_game`, `reveal_answer`, `show_leaderboard`, `next_question`, `end_game`

## Project Structure

```
src/
├── app/
│   ├── (player)/        # Player routes (join, play)
│   ├── (host)/          # Host routes (quizzes, presenter)
│   └── api/             # API routes
├── components/
│   ├── game/            # Game-specific components
│   └── ui/              # shadcn/ui base components
├── lib/
│   ├── api/             # API utilities (http, rateLimit)
│   ├── db/              # Database client
│   ├── realtime/        # Socket.IO events and client
│   ├── scoring/         # Scoring algorithm
│   ├── sessions/        # Session management
│   └── validation/      # Zod schemas
prisma/
├── schema.prisma        # Database schema
└── seed.ts              # Demo data seeder
server.ts                # Custom server with Socket.IO
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (with hot reload) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run db:push` | Push schema changes to DB |
| `npm run db:studio` | Open Prisma Studio |

## Key URLs

| URL | Description |
|-----|-------------|
| `/join` | Player join page (enter PIN + nickname) |
| `/play/[sessionId]` | Player game view |
| `/host/quizzes` | Host quiz management |
| `/host/quizzes/[quizId]` | Quiz editor |
| `/presenter/[sessionId]` | Presenter view (screen share) |

## Notes

- **No participant authentication**: Players join with just a PIN and nickname.
- **WebSocket required**: Real-time gameplay uses Socket.IO. Deploy to platforms that support WebSockets.
- **Host API key**: Protect host control endpoints with the `HOST_API_KEY` header.
- **Demo endpoints**: Only available when `DEMO_API_KEY` is set; disable in production.

## Troubleshooting

**"Cannot find module '@prisma/client'"**
- Run `npx prisma generate`

**Socket.IO not connecting**
- Ensure you're using `npm run dev` (not `next dev` directly)
- Check browser console for WebSocket errors

**Database errors**
- Delete `dev.db` and re-run `npx prisma migrate dev`
