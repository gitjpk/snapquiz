# snapquiz Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-20

## Active Technologies
- SQLite (via Prisma ORM) (001-live-quiz-game)
- TypeScript (Node.js 20 LTS) + Next.js (App Router), React, Tailwind CSS, canvas-confetti (new), Web Audio API (native) (003-podium-animations)
- N/A (client-side feature, no database changes) (003-podium-animations)
- TypeScript (Node.js 20 LTS) + Next.js (App Router), bcrypt (password hashing), jose (JWT tokens) (002-host-password-protection)
- SQLite via Prisma (existing); adds `HostCredential` and `HostSession` tables (002-host-password-protection)
- TypeScript 5.x, Node.js 22+ + Next.js 15 (App Router), React 19, Prisma 6, Zod, Socket.io (004-ai-quiz-generation)
- SQLite via Prisma (existing), LLM settings stored per-host (004-ai-quiz-generation)

- TypeScript (Node.js 20 LTS) + Next.js (App Router), React, Tailwind CSS, shadcn/ui, Prisma, Zod, Socket.IO (001-live-quiz-game)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript (Node.js 20 LTS): Follow standard conventions

## Recent Changes
- 004-ai-quiz-generation: Added TypeScript 5.x, Node.js 22+ + Next.js 15 (App Router), React 19, Prisma 6, Zod, Socket.io
- 002-host-password-protection: Added TypeScript (Node.js 20 LTS) + Next.js (App Router), bcrypt (password hashing), jose (JWT tokens)
- 003-podium-animations: Added TypeScript (Node.js 20 LTS) + Next.js (App Router), React, Tailwind CSS, canvas-confetti (new), Web Audio API (native)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
