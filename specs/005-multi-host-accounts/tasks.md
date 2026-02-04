# Tasks: Multi-Host Accounts

**Input**: Design documents from `/specs/005-multi-host-accounts/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: No tests explicitly requested in spec. Test tasks omitted.

**Organization**: Tasks grouped by user story (5 stories: P1, P1, P2, P2, P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization and dependencies

- [x] T001 Install @azure/msal-node dependency via `npm install @azure/msal-node`
- [x] T002 [P] Add Azure AD environment variables to .env.example
- [x] T003 [P] Update .gitignore if needed for any Azure-related files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema Changes

- [x] T004 Update Host model in prisma/schema.prisma (add microsoftId, email, lastLoginAt)
- [x] T005 Remove HostCredential model from prisma/schema.prisma
- [x] T006 Update HostSession model in prisma/schema.prisma (add hostId FK, cascade delete)
- [x] T007 Update LLMSettings model in prisma/schema.prisma (add proper Host relation, cascade delete)
- [x] T008 Run database migration with `npx prisma db push --force-reset`

### MSAL Configuration

- [x] T009 Create MSAL configuration module in src/lib/auth/msal.ts

### Auth Middleware Update

- [x] T010 Update requireAuth() in src/lib/auth/middleware.ts to return hostId alongside sessionId

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Connexion via Microsoft (Priority: P1) 🎯 MVP

**Goal**: Formateur peut se connecter via Microsoft Entra ID et accéder à son tableau de bord

**Independent Test**: Navigate to login, click Microsoft button, complete OAuth, arrive at /host/quizzes

### Implementation for User Story 1

- [x] T011 [US1] Create login API route in src/app/api/auth/login/route.ts (redirect to Microsoft)
- [x] T012 [US1] Create callback API route in src/app/api/auth/callback/route.ts (handle OAuth response, upsert Host, create session)
- [x] T013 [US1] Update session creation in src/lib/auth/session.ts to include hostId claim in JWT
- [x] T014 [US1] Create login page with Microsoft button in src/app/login/page.tsx
- [x] T015 [P] [US1] Create MicrosoftLoginButton component in src/components/auth/MicrosoftLoginButton.tsx
- [x] T016 [US1] Update auth status endpoint in src/app/api/auth/status/route.ts to return host info (id, email, displayName)
- [x] T017 [US1] Add error handling for OAuth failures (user cancel, Entra ID unavailable) in callback route
- [x] T018 [US1] Update root page src/app/page.tsx to show login button for unauthenticated users

**Checkpoint**: User Story 1 complete - formateur can login via Microsoft and see dashboard

---

## Phase 4: User Story 2 - Isolation des données par formateur (Priority: P1)

**Goal**: Chaque formateur ne voit que ses propres quiz et sessions

**Independent Test**: Create 2 hosts with different quizzes, verify each only sees their own

### Implementation for User Story 2

- [x] T019 [US2] Update GET /api/quizzes in src/app/api/quizzes/route.ts to filter by hostId
- [x] T020 [US2] Update POST /api/quizzes in src/app/api/quizzes/route.ts to set ownerHostId from auth
- [x] T021 [US2] Update GET /api/quizzes/[quizId] in src/app/api/quizzes/[quizId]/route.ts to verify ownership (403 if not owner)
- [x] T022 [US2] Update PUT /api/quizzes/[quizId] in src/app/api/quizzes/[quizId]/route.ts to verify ownership
- [x] T023 [US2] Update DELETE /api/quizzes/[quizId] in src/app/api/quizzes/[quizId]/route.ts to verify ownership
- [x] T024 [US2] Update GET /api/sessions in src/app/api/sessions/route.ts to filter by hostId (via quiz ownership)
- [x] T025 [US2] Update POST /api/sessions in src/app/api/sessions/route.ts to verify quiz ownership before creating session
- [x] T026 [US2] Update GET /api/sessions/[sessionId] in src/app/api/sessions/[sessionId]/route.ts to verify ownership
- [x] T027 [US2] Update session control routes to verify ownership in src/app/api/sessions/[sessionId]/control/route.ts

**Checkpoint**: User Story 2 complete - data isolation enforced, 403 for unauthorized access

---

## Phase 5: User Story 3 - Paramètres LLM par formateur (Priority: P2)

**Goal**: Chaque formateur peut configurer sa propre clé API LLM

**Independent Test**: Two hosts configure different API keys, each generates quiz with their own key

### Implementation for User Story 3

- [x] T028 [US3] Update GET /api/settings/llm to filter by hostId in src/app/api/llm/settings/route.ts
- [x] T029 [US3] Update PUT /api/llm/settings to associate with hostId in src/app/api/llm/settings/route.ts
- [x] T030 [US3] Update quiz generation to use host's LLM settings in src/app/api/quizzes/generate/route.ts
- [x] T031 [US3] Update quiz generation from URL to use host's LLM settings in src/app/api/quizzes/generate/url/route.ts
- [x] T032 [US3] Update LLM test-connection to use host's settings in src/app/api/llm/test-connection/route.ts

**Checkpoint**: User Story 3 complete - each formateur uses their own LLM key ✅

---

## Phase 6: User Story 4 - Déconnexion (Priority: P2)

**Goal**: Formateur peut se déconnecter de l'application

**Independent Test**: Login, click logout, verify redirected to home and cannot access /host/quizzes

### Implementation for User Story 4

- [x] T033 [US4] Update logout API route in src/app/api/auth/logout/route.ts to revoke HostSession
- [x] T034 [US4] Add logout button to host layout/navbar in src/components/layout/HostNav.tsx
- [x] T035 [US4] Ensure session cookie is cleared on logout (HTTP-only cookie deletion)

**Checkpoint**: User Story 4 complete - formateur can logout securely ✅

---

## Phase 7: User Story 5 - Profil formateur (Priority: P3)

**Goal**: Formateur peut voir son nom et email depuis Microsoft

**Independent Test**: Login with Microsoft, view profile, see name and email from Microsoft account

### Implementation for User Story 5

- [x] T036 [P] [US5] Create profile page in src/app/(host)/host/profile/page.tsx
- [x] T037 [US5] Display host info (displayName, email) from auth status in profile page
- [x] T038 [US5] Add user avatar/name display in navbar in src/app/(host)/layout.tsx

**Checkpoint**: User Story 5 complete - formateur sees their Microsoft profile info ✅

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T039 [P] Update .env.example with all required Azure AD variables
- [x] T040 [P] Update README.md with Microsoft Entra ID setup instructions
- [x] T041 Remove old password-based auth code (legacy setup/change-password routes removed)
- [ ] T042 Run quickstart.md validation (manual test of OAuth flow)
- [x] T043 Run `npm run build` to verify no TypeScript errors
- [x] T044 Run `npm run lint` to verify code quality

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────────────────────────────┐
                                                      ↓
Phase 2: Foundational ───────────────────────────────┤ BLOCKS ALL USER STORIES
                                                      ↓
         ┌────────────────────────────────────────────┼────────────────────────────────┐
         ↓                                            ↓                                ↓
Phase 3: US1 (P1)         Phase 4: US2 (P1)          Phase 5: US3 (P2)
(Login)                   (Data Isolation)            (LLM Settings)
         │                         │                           │
         └─────────────────────────┼───────────────────────────┘
                                   ↓
                         Phase 6: US4 (P2)    Phase 7: US5 (P3)
                         (Logout)             (Profile)
                                   │                   │
                                   └───────────────────┘
                                             ↓
                                   Phase 8: Polish
```

### User Story Dependencies

- **US1 (Login)**: Required for all other stories - provides authentication
- **US2 (Data Isolation)**: Depends on US1 (needs hostId from auth). Can run in parallel with US3.
- **US3 (LLM Settings)**: Depends on US1. Can run in parallel with US2.
- **US4 (Logout)**: Depends on US1 (needs active session to logout).
- **US5 (Profile)**: Depends on US1 (needs host info from auth).

### Within Each User Story

- Schema changes before code using schema
- MSAL config before OAuth routes
- Core implementation before UI
- Commit after each task or logical group

### Parallel Opportunities per Phase

**Phase 2 (Foundational)**:
```
T004, T005, T006, T007 → Can edit schema.prisma sequentially (same file)
T009 → Can run parallel to schema changes (different file)
T008 → MUST run after T004-T007
T010 → MUST run after T009
```

**Phase 3 (US1)**:
```
T011 + T015 → Parallel (different files)
T012, T013 → Sequential (callback depends on session.ts)
T014, T016, T017, T018 → Can run after T011-T013
```

**Phase 4 (US2)**:
```
T019, T020 → Same file, sequential
T021, T022, T023 → Same file, sequential
T024, T025 → Same file, sequential
T026, T027 → Sequential
```

**Across User Stories (after US1 done)**:
```
US2 (T019-T027) ┐
                ├─→ Can run in parallel
US3 (T028-T032) ┘
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Login) ← **First testable increment**
4. Complete Phase 4: User Story 2 (Data Isolation) ← **MVP complete**
5. **STOP and VALIDATE**: Test multi-host isolation
6. Deploy to Azure with Microsoft OAuth

### Incremental Delivery

| Increment | Stories | Value Delivered |
|-----------|---------|-----------------|
| 1 (MVP) | US1 + US2 | Multi-host login with data isolation |
| 2 | + US3 | Each host uses their own LLM key |
| 3 | + US4 | Secure logout |
| 4 | + US5 | Profile display |

---

## Notes

- Cookie name changes from `snapquiz-host` to `host_session` per OpenAPI spec
- `ownerHostId` on Quiz should be required after migration (not nullable)
- All 403 responses should include `{ error: "Non autorisé" }` per FR-007
- Session expiration is 7 days per clarification
- Use Microsoft `oid` claim as Host.microsoftId per research decision
