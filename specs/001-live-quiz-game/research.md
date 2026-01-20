# Research: Live Quiz Game Sessions

**Branch**: 001-live-quiz-game  
**Date**: 2026-01-20  
**Goal**: Resolve technical decisions needed to implement the spec using Next.js + SQLite + shadcn.

## Decision 1: Next.js Architecture (App Router)

- **Decision**: Use Next.js App Router with Route Handlers for server APIs and React Server Components for page composition.
- **Rationale**: Aligns with modern Next.js conventions, supports fast initial loads, and keeps UI + API in one deployable.
- **Alternatives considered**:
  - Pages Router: older patterns, less aligned with current Next.js direction.
  - Separate backend service: adds operational complexity and violates “Keep It Simple” for MVP.

## Decision 2: Database Access (Prisma + SQLite)

- **Decision**: Use Prisma ORM with SQLite for persistence.
- **Rationale**: Simple local development, strong type safety, migrations, and stable patterns for relational data (quizzes, sessions, responses).
- **Alternatives considered**:
  - Drizzle + SQLite: also viable, but Prisma’s tooling/migrations are more standardized for teams.
  - Raw SQL: higher risk of mistakes and harder to maintain.

## Decision 3: Real-Time Session Updates

- **Decision**: Use WebSockets (Socket.IO) for real-time game state updates (lobby count, question start, reveal, leaderboard).
- **Rationale**: The spec success criteria require near-real-time broadcast to many participants. WebSockets reduce polling overhead and latency.
- **Alternatives considered**:
  - Short polling: simpler but can be noisy and may not meet latency goals at scale.
  - Server-Sent Events (SSE): viable for one-way broadcast, but still needs a clean approach for participant submissions and can be tricky depending on hosting/runtime.

## Decision 4: Session Identity (PIN)

- **Decision**: Use a 6-digit numeric PIN per live session, unique among active sessions.
- **Rationale**: Fast to type on mobile, familiar to users, and easy to communicate verbally.
- **Alternatives considered**:
  - Short alphanumeric code: potentially shorter but more error-prone when spoken.
  - Full URL only: higher friction for workshop settings.

## Decision 5: Scoring Algorithm

- **Decision**: Award points only for correct answers, with a speed bonus based on submission timestamp relative to the time limit.
- **Rationale**: Matches “correct + speed” while remaining explainable to users.
- **Alternatives considered**:
  - Complex streak multipliers in MVP: fun but increases complexity and edge cases.

## Decision 6: Host Identity (MVP)

- **Decision**: Participants do not authenticate; hosts are treated as privileged users, but MVP can start with a single “workshop host” mode (no multi-tenant host accounts) and add full auth later.
- **Rationale**: Keeps join flow frictionless and avoids blocking MVP on account systems.
- **Alternatives considered**:
  - Full host authentication (Auth.js / NextAuth): higher scope; still a good follow-on for production.

## Decision 7: Media in Questions

- **Decision**: MVP supports media by URL (image/video links) instead of upload.
- **Rationale**: Meets the spec requirement (“can be added”) without building storage/CDN/upload flows.
- **Alternatives considered**:
  - Upload to object storage (S3/Azure Blob): better UX but more infrastructure and security work.

## Decision 8: Validation and Security

- **Decision**: Use shared Zod schemas for validating all inbound data (quiz create/update, join, answer submission) and apply output encoding for user-provided strings.
- **Rationale**: Directly supports Secure-by-Default and reduces bugs.
- **Alternatives considered**:
  - Ad hoc validation: higher risk and inconsistent error handling.

## Decision 9: Testing Strategy

- **Decision**: Unit tests cover scoring, PIN generation, and validation; Playwright provides one smoke E2E flow (host creates/starts session → participant joins → answers → sees result).
- **Rationale**: Meets constitution quality gates with minimal overhead.
- **Alternatives considered**:
  - Only E2E tests: slower feedback, brittle.
  - Extensive integration suite up front: too heavy for MVP.
