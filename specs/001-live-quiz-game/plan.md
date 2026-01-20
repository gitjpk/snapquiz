# Implementation Plan: Live Quiz Game Sessions

**Branch**: `001-live-quiz-game` | **Date**: 2026-01-20 | **Spec**: [specs/001-live-quiz-game/spec.md](spec.md)
**Input**: Feature specification from `/specs/001-live-quiz-game/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a modern, mobile-friendly live quiz experience where a host launches a session with a short PIN/QR join flow, participants answer in real time, and the system reveals results + leaderboards + final podium.

Technical approach: Next.js (App Router) web app with a SQLite database for quizzes/sessions, and a real-time channel (WebSocket) to broadcast session state changes (lobby updates, question start/end, reveal, leaderboard).

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Node.js 20 LTS)  
**Primary Dependencies**: Next.js (App Router), React, Tailwind CSS, shadcn/ui, Prisma, Zod, Socket.IO  
**Storage**: SQLite (via Prisma ORM)  
**Testing**: Vitest (unit), Playwright (smoke E2E)  
**Target Platform**: Modern evergreen browsers (mobile + desktop) + Node.js server runtime
**Project Type**: single  
**Performance Goals**: Meet spec success criteria for join + state propagation (e.g., question visible within 2s for 95% at ~200 participants)  
**Constraints**: Low-friction join (no participant accounts), predictable error states, minimal UI latency on mobile, secure handling of untrusted inputs (nicknames, quiz text)  
**Scale/Scope**: MVP targets ~200 concurrent participants per session; single-region deployment; sessions are time-bounded and can be cleaned up after completion

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

GATE: All items must be satisfied to proceed.

- Accessible, Responsive UX: Player UI supports one-handed mobile use; presenter view is projector/screen-share friendly; keyboard/focus states work for core flows.
- Secure-by-Default: Server-side validation for all write operations; parameterized DB access; output encoding; secrets only in env vars.
- Dynamic Data: Quizzes, sessions, participants, responses are persisted and served through server routes; UI is driven by server/session state.
- Reliability: Invalid PINs, ended sessions, and disconnects surface clear UX; server logs errors without leaking secrets.
- Keep It Simple: Single Next.js app (no microservices); minimal abstractions; documented local setup.

Quality Gates (from constitution): `install → build` passes; lint/format enforced; unit tests for scoring/validation and one Playwright smoke test for join → answer → results.

Post-Design Re-check (after Phase 1 outputs): PASS (no violations identified).

## Project Structure

### Documentation (this feature)

```text
specs/001-live-quiz-game/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── app/
│   ├── (host)/
│   │   ├── host/
│   │   └── presenter/
│   ├── (player)/
│   │   ├── join/
│   │   └── play/
│   └── api/
│       ├── quizzes/
│       ├── sessions/
│       └── realtime/
├── components/
│   ├── ui/              # shadcn/ui components
│   └── game/
├── lib/
│   ├── db/
│   ├── realtime/
│   ├── scoring/
│   └── validation/
└── styles/

prisma/
└── schema.prisma

tests/
├── unit/
└── e2e/
```

**Structure Decision**: Single Next.js application (App Router) that includes UI routes and server routes in one codebase, with a shared `src/lib/*` layer for validation, scoring, and persistence.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Phase 0: Research Output

See [specs/001-live-quiz-game/research.md](research.md) for concrete technical decisions (real-time approach, ORM choice, media handling, and host identity approach).

## Phase 1: Design Outputs

- Data model: [specs/001-live-quiz-game/data-model.md](data-model.md)
- API contracts: [specs/001-live-quiz-game/contracts/](contracts/)
- Local dev quickstart: [specs/001-live-quiz-game/quickstart.md](quickstart.md)

## Phase 2: Task Planning (Stop Point)

Phase 2 breaks the implementation into independently shippable tasks (join flow, host session controls, scoring/leaderboard, realtime messaging, tests, and deployment). This is produced by `/speckit.tasks`.
