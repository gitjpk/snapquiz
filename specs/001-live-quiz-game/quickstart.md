# Quickstart: Live Quiz Game Sessions (Next.js + SQLite)

**Branch**: 001-live-quiz-game  
**Date**: 2026-01-20  

This quickstart describes the expected local workflow once implementation begins.

## Prerequisites

- Node.js 20 LTS
- npm (or pnpm)

## Local Setup (planned)

1. Install dependencies

   - `npm install`

2. Configure environment variables

   - Copy `.env.example` → `.env`
   - Set at minimum:
     - `DATABASE_URL="file:./dev.db"`

3. Initialize the database (Prisma)

   - `npx prisma migrate dev`
   - (Optional) `npx prisma db seed`

4. Run the dev server

   - `npm run dev`

5. Run tests

   - Unit tests: `npm run test`
   - E2E smoke: `npx playwright test`

## shadcn/ui Setup (planned)

- Initialize shadcn:
  - `npx shadcn@latest init`
- Add components as needed (button, input, card, dialog, etc.).

## Notes

- Participants do not authenticate.
- Host mode may start as a single-host MVP; full host authentication can be added later.
- Real-time gameplay requires a runtime that supports WebSockets.
