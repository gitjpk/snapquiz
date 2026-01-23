---

description: "Task list for implementing Live Quiz Game Sessions"
---

# Tasks: Live Quiz Game Sessions

**Input**: Design documents from `/specs/001-live-quiz-game/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/  
**Target Stack**: Next.js (App Router) + SQLite (Prisma) + shadcn/ui + Socket.IO  

## Implementation Strategy (MVP first)

- MVP scope is **User Story 1** only: a participant can join via PIN/QR, wait in lobby, answer a question, and see correctness.
- Build **Setup → Foundational → US1**, then stop and validate against US1 independent test.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the web app baseline (Next.js + shadcn/ui) and developer workflow.

- [X] T001 Initialize Next.js (App Router) + TypeScript + Tailwind project in package.json (creates src/app/layout.tsx, src/app/page.tsx)
- [X] T002 Configure shadcn/ui and generate base components in src/components/ui/ (e.g., src/components/ui/button.tsx, input.tsx, card.tsx)
- [X] T003 Configure lint + format scripts in package.json and .eslintrc.* (ESLint/Prettier)
- [X] T004 [P] Add global styles and responsive layout primitives in src/app/layout.tsx and src/styles/globals.css
- [X] T005 [P] Add shared app shell components in src/components/game/AppShell.tsx (header/footer/layout wrapper)
- [X] T006 Configure Vitest test runner in vitest.config.ts and add tests/unit/.gitkeep
- [X] T007 Configure Playwright smoke testing in playwright.config.ts and add tests/e2e/.gitkeep
- [X] T008 Add environment variable template in .env.example (DATABASE_URL, HOST_API_KEY, DEMO_API_KEY)
- [X] T009 Add a basic error boundary and not-found pages in src/app/error.tsx and src/app/not-found.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before any user story can be implemented.

- [X] T010 Define Prisma SQLite schema for Quiz/Question/AnswerOption/LiveSession/Participant/Response/Score in prisma/schema.prisma
- [X] T011 Create Prisma client wrapper in src/lib/db/client.ts and ensure DATABASE_URL is used
- [X] T012 Add database seed scaffolding for local demos in prisma/seed.ts
- [X] T013 [P] Implement shared Zod validation schemas for requests/responses in src/lib/validation/schemas.ts
- [X] T014 [P] Implement typed API response helpers (errors + status codes) in src/lib/api/http.ts
- [X] T015 Implement PIN generator + uniqueness check for active sessions in src/lib/sessions/pin.ts
- [X] T016 Define realtime event types matching specs/001-live-quiz-game/contracts/asyncapi.yaml in src/lib/realtime/events.ts
- [X] T017 Implement Socket.IO server bootstrap in server.ts (attach Socket.IO to the Next.js server)
- [X] T018 Update dev/start scripts to use server.ts in package.json
- [X] T019 Implement realtime client helper (connect/subscribe/unsubscribe) in src/lib/realtime/client.ts
- [X] T020 Implement session state service (lobby → question → reveal → leaderboard → end) in src/lib/sessions/sessionService.ts
- [X] T021 [P] Unit test PIN generation rules in tests/unit/pin.test.ts
- [X] T022 [P] Unit test core request validation in tests/unit/validation.test.ts

**Checkpoint**: Foundation ready — user stories can now be implemented.

---

## Phase 3: User Story 1 - Join and Play a Live Session (Priority: P1) 🎯 MVP

**Goal**: Participants join via PIN/QR with a nickname, wait in a lobby, answer a live question from their device, and see correctness.

**Independent Test**: Create a demo session (via dev endpoint), join via PIN on a mobile-sized viewport, observe lobby state, start a question (via dev endpoint), submit an answer before time expires, and see a locked/confirmed answer + correctness result.

### Implementation (US1)

- [X] T023 [US1] Implement resolve-by-PIN endpoint in src/app/api/sessions/by-pin/[pin]/route.ts
- [X] T024 [US1] Implement join-session endpoint in src/app/api/sessions/[sessionId]/join/route.ts
- [X] T025 [US1] Implement submit-answer endpoint in src/app/api/sessions/[sessionId]/answer/route.ts
- [X] T026 [P] [US1] Create shared "join form" component in src/components/game/JoinForm.tsx
- [X] T027 [US1] Build player join page (PIN + nickname) in src/app/(player)/join/page.tsx
- [X] T028 [P] [US1] Build player lobby UI component in src/components/game/PlayerLobby.tsx
- [X] T029 [P] [US1] Build player question UI component (large tap targets) in src/components/game/PlayerQuestion.tsx
- [X] T030 [US1] Build player play page state machine (lobby → question → answered → reveal) in src/app/(player)/play/[sessionId]/page.tsx
- [X] T031 [US1] Wire realtime subscription for player session updates in src/app/(player)/play/[sessionId]/page.tsx
- [X] T032 [US1] Add server-side validation + safe error messages for join/answer in src/app/api/sessions/[sessionId]/join/route.ts
- [X] T033 [US1] Add dev-only endpoint to create a demo quiz + demo session (guarded by DEMO_API_KEY) in src/app/api/dev/demo-session/route.ts
- [X] T034 [US1] Add dev-only endpoint to start/advance demo question state (guarded by DEMO_API_KEY) in src/app/api/dev/demo-control/route.ts
- [X] T035 [P] [US1] Add Playwright smoke test for join → answer flow in tests/e2e/us1-join-and-answer.spec.ts

**Checkpoint**: US1 works end-to-end and is independently demoable.

---

## Phase 4: User Story 2 - Host Runs a Two-Screen Game (Priority: P2)

**Goal**: A host can create or select a quiz, launch a session with PIN/QR join, and drive the game flow from a presenter view designed for screen sharing.

**Independent Test**: Host creates a quiz with one question, starts a live session, opens presenter view, sees lobby count increase as participants join, starts the game, triggers reveal + leaderboard for one question.

### Implementation (US2)

- [X] T036 [US2] Implement quizzes list/create endpoint in src/app/api/quizzes/route.ts
- [X] T037 [US2] Implement quiz get/update endpoint in src/app/api/quizzes/[quizId]/route.ts
- [X] T038 [P] [US2] Build host quiz list page in src/app/(host)/host/quizzes/page.tsx
- [X] T039 [P] [US2] Build host quiz editor page (create/update quiz + questions) in src/app/(host)/host/quizzes/[quizId]/page.tsx
- [X] T040 [US2] Implement create-session endpoint in src/app/api/sessions/route.ts
- [X] T041 [US2] Implement host control endpoint (start/next/reveal/leaderboard/end) guarded by HOST_API_KEY in src/app/api/sessions/[sessionId]/control/route.ts
- [X] T042 [P] [US2] Build presenter view page (screen-share friendly layout) in src/app/(host)/presenter/[sessionId]/page.tsx
- [X] T043 [P] [US2] Implement presenter control panel component in src/components/game/PresenterControls.tsx
- [X] T044 [P] [US2] Implement presenter lobby component (participant count + status) in src/components/game/PresenterLobby.tsx
- [X] T045 [US2] Add join URL + QR code rendering in presenter UI in src/components/game/JoinQrCode.tsx
- [X] T046 [US2] Ensure presenter state changes broadcast realtime events (question.started/question.closed) in src/lib/sessions/sessionService.ts

**Checkpoint**: US2 host flow is independently usable (even without US3 scoring polish).

---

## Phase 5: User Story 3 - Energy and Competition (Scoring + Leaderboard + Podium) (Priority: P3)

**Goal**: After each question, show answer distribution + correct answer, update leaderboards, and end with a podium; award points based on correctness and speed.

**Independent Test**: Run a session with two participants who answer correctly at different times; verify different points, leaderboard ordering, and final podium after ending the game.

### Implementation (US3)

- [X] T047 [US3] Implement scoring algorithm (correctness + speed bonus) in src/lib/scoring/scoring.ts
- [X] T048 [P] [US3] Add unit tests for scoring in tests/unit/scoring.test.ts
- [X] T049 [US3] Implement answer distribution computation in src/lib/sessions/results.ts
- [X] T050 [US3] Implement leaderboard computation + rank assignment in src/lib/sessions/leaderboard.ts
- [X] T051 [US3] Persist per-response correctness + points and update Score totals in src/lib/sessions/sessionService.ts
- [X] T052 [US3] Emit answer.reveal and leaderboard.updated realtime events in src/lib/sessions/sessionService.ts
- [X] T053 [P] [US3] Build answer reveal component (distribution + correct option) in src/components/game/AnswerReveal.tsx
- [X] T054 [P] [US3] Build leaderboard component (top N + participant's own rank) in src/components/game/Leaderboard.tsx
- [X] T055 [P] [US3] Build final podium component in src/components/game/Podium.tsx
- [X] T056 [US3] Extend presenter view to show reveal/leaderboard/podium states in src/app/(host)/presenter/[sessionId]/page.tsx
- [X] T057 [US3] Extend player view to show reveal/leaderboard/final result states in src/app/(player)/play/[sessionId]/page.tsx
- [X] T058 [US3] Add end-of-game flow and game.ended realtime event in src/lib/sessions/sessionService.ts

**Checkpoint**: US3 game mechanics are complete and visibly engaging.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple stories and harden the MVP.

- [X] T059 [P] Accessibility pass on join/play/presenter pages in src/app/(player)/join/page.tsx and src/app/(host)/presenter/[sessionId]/page.tsx
- [X] T060 Security hardening for untrusted strings (nickname/quiz text) in src/lib/validation/schemas.ts
- [X] T061 Add basic request throttling for join/answer endpoints in src/lib/api/rateLimit.ts
- [X] T062 Add database indexes/constraints for performance (unique PIN, response uniqueness) in prisma/schema.prisma
- [X] T063 Update local setup documentation and validate quickstart steps in specs/001-live-quiz-game/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) → Foundational (Phase 2) → User Stories
- Polish (Phase 6) depends on completing the desired user stories.

### User Story Dependency Graph

- US1 (P1) depends on Phase 2 only.
- US2 (P2) depends on Phase 2 only.
- US3 (P3) depends on Phase 2 and builds on US1 (answer submissions) and US2 (host game control) for meaningful results.

### Parallel Opportunities (Examples)

- Setup: T004 and T005 can run in parallel.
- Foundational: T013 and T014 can run in parallel; T021 and T022 can run in parallel.
- US1: T026/T028/T029/T035 can run in parallel once endpoints exist.
- US2: T038/T039/T042/T043/T044 can run in parallel once API endpoints exist.
- US3: T048/T053/T054/T055 can run in parallel once services exist.

## Parallel Execution Examples (Per User Story)

### US1

- Workstream A: T023, T024, T025 (API endpoints)
- Workstream B: T026, T027 (join UI)
- Workstream C: T028, T029 (player UI components)
- Workstream D: T035 (Playwright smoke)

### US2

- Workstream A: T036, T037, T040, T041 (HTTP APIs)
- Workstream B: T038, T039 (host quiz UI)
- Workstream C: T042, T043, T044, T045 (presenter UI)

### US3

- Workstream A: T047, T049, T050, T051, T052, T058 (services + events)
- Workstream B: T053, T054, T055 (UI components)
- Workstream C: T048 (unit tests)

## Validation: Checklist Format

All implementation tasks in this file use the required checklist format:

- `- [ ] T### [P?] [US#?] Description with file path`
