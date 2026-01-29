# Tasks: Host Password Protection

**Input**: Design documents from `/specs/002-host-password-protection/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/  
**Target Stack**: Next.js (App Router) + bcrypt + jose (JWT)

## Implementation Strategy (MVP first)

- MVP scope is **User Story 1 (Secure Host Access)** + **User Story 3 (Protected API)** as P1 priorities
- US1 and US3 are interdependent (auth infrastructure serves both)
- US2 (Password Change) is P2 and can be delivered as an enhancement

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and update database schema

- [X] T001 Install bcrypt, jose, @types/bcrypt in package.json
- [X] T002 Add HostCredential and HostSession models to prisma/schema.prisma
- [X] T003 Run prisma migrate to create new tables
- [X] T004 [P] Add Zod validation schemas for auth requests in src/lib/validation/authSchemas.ts

---

## Phase 2: Foundational (Core Auth Logic)

**Purpose**: Core authentication utilities that all features depend on

- [X] T005 Implement password hash/verify functions using bcrypt in src/lib/auth/password.ts
- [X] T006 [P] Implement JWT create/validate functions using jose in src/lib/auth/session.ts
- [X] T007 [P] Extend existing src/lib/api/rateLimit.ts with login-specific limits (5 attempts/min/IP)
- [X] T008 Unit tests for password and session utilities in tests/unit/auth.test.ts

**Checkpoint**: Foundation ready — auth utilities tested and working

---

## Phase 3: User Story 1 - Secure Host Access (Priority: P1) 🎯 MVP

**Goal**: Host area requires password authentication; first-run setup creates initial password.

**Independent Test**: Access /host/quizzes without auth → redirected to login. Enter correct password → access granted. Return after 24h → must re-authenticate.

### Implementation (US1)

- [X] T009 [US1] Create POST /api/auth/setup endpoint in src/app/api/auth/setup/route.ts
- [X] T010 [US1] Create POST /api/auth/login endpoint in src/app/api/auth/login/route.ts
- [X] T011 [US1] Create POST /api/auth/logout endpoint in src/app/api/auth/logout/route.ts
- [X] T012 [US1] Create GET /api/auth/status endpoint in src/app/api/auth/status/route.ts
- [X] T013 [US1] Create SetupForm component in src/components/auth/SetupForm.tsx
- [X] T014 [US1] Create LoginForm component in src/components/auth/LoginForm.tsx
- [X] T015 [US1] Create setup page at src/app/(host)/setup/page.tsx
- [X] T016 [US1] Create login page at src/app/(host)/login/page.tsx
- [X] T017 [US1] Add Next.js middleware for route protection in src/middleware.ts
- [X] T018 [US1] Update host layout to show logout button when authenticated in src/app/(host)/layout.tsx
- [X] T019 [US1] Add server-side + client-side validation rejecting empty/whitespace-only passwords
- [X] T020 [US1] Handle edge case: session expiry mid-operation (show re-auth prompt)

**Checkpoint**: US1 works end-to-end — host can setup, login, logout, and sessions persist 24h

---

## Phase 4: User Story 3 - Protected API Endpoints (Priority: P1) 🎯 MVP

**Goal**: All host-only API endpoints validate session token; return 401/403 for unauthenticated requests.

**Independent Test**: POST /api/quizzes without cookie → 401. POST with valid cookie → 200/201.

### Implementation (US3)

- [X] T021 [US3] Create requireAuth middleware function in src/lib/auth/middleware.ts
- [X] T022 [US3] Protect POST /api/quizzes endpoint with requireAuth
- [X] T023 [US3] Protect GET/PUT/DELETE /api/quizzes/[quizId] endpoints with requireAuth
- [X] T024 [US3] Protect POST /api/sessions endpoint with requireAuth
- [X] T025 [US3] Protect POST /api/sessions/[sessionId]/control endpoint with requireAuth
- [X] T026 [US3] Verify player endpoints (join, answer) remain public
- [X] T027 [US3] Add integration tests for protected endpoints in tests/unit/authMiddleware.test.ts

**Checkpoint**: US3 works end-to-end — 100% of host endpoints reject unauthenticated requests

---

## Phase 5: User Story 2 - Password Change (Priority: P2)

**Goal**: Authenticated host can change password from settings page.

**Independent Test**: Log in, navigate to settings, change password, log out, verify new password works.

### Implementation (US2)

- [X] T028 [US2] Create POST /api/auth/change-password endpoint in src/app/api/auth/change-password/route.ts
- [X] T029 [US2] Create ChangePasswordForm component in src/components/auth/ChangePasswordForm.tsx
- [X] T030 [US2] Create settings page at src/app/(host)/host/settings/page.tsx
- [X] T031 [US2] Add settings link to host layout navigation
- [X] T032 [US2] Handle edge case: incorrect current password

**Checkpoint**: US2 complete — host can change password

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: CLI tools, testing, and edge cases

- [X] T033 Create reset-password CLI script in scripts/reset-password.ts
- [X] T034 Add npm script "reset-password" to package.json
- [X] T035 [P] Playwright E2E test for login flow in tests/e2e/host-auth.spec.ts (include <3s timing assertion per SC-002)
- [X] T036 [P] Playwright E2E test for protected API endpoints (include <2s rejection timing per SC-003)
- [X] T037 Verify rate limiting blocks 6th failed login attempt
- [X] T038 Add unit test for unicode/special character passwords in tests/unit/auth.test.ts
- [X] T039 Audit logging code to verify passwords never logged (FR-009 compliance)
- [X] T040 Update quickstart.md with final setup instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) → Foundational (Phase 2) → User Stories (Phases 3-5)
- Polish (Phase 6) depends on completing US1 + US3

### User Story Dependency Graph

- US1 (P1) depends on Phase 2 only
- US3 (P1) depends on Phase 2 + US1 (needs login working first)
- US2 (P2) depends on US1 + US3 (needs full auth system)

### Parallel Opportunities (Examples)

**Setup**: T001-T004 can run sequentially (dependencies)

**Foundational**: T005, T006, T007 can run in parallel

**US1**: T009-T012 (API endpoints) can run in parallel; T013-T014 (components) can run in parallel

**US3**: T022-T026 (endpoint protection) can run in parallel after T021

**Polish**: T035 and T036 can run in parallel

## Parallel Execution Examples (Per User Story)

### US1 (Secure Host Access)

- Workstream A: T009, T010, T011, T012 (API endpoints)
- Workstream B: T013, T014 (UI components)
- Workstream C: T015, T016, T017, T018 (pages + middleware)

### US3 (Protected API)

- Workstream A: T021 (middleware function)
- Workstream B: T022, T023, T024, T025 (apply to endpoints - can parallel after T021)
- Workstream C: T026, T027 (verification + tests)

### US2 (Password Change)

- Workstream A: T028 (API endpoint)
- Workstream B: T029, T030, T031 (UI components + pages)

## Validation: Checklist Format

All implementation tasks in this file use the required checklist format:

- `- [ ] T### [P?] [US#?] Description with file path`
