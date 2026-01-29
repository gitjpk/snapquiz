# Tasks: AI Quiz Generation Assistant

**Input**: Design documents from `/specs/004-ai-quiz-generation/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create project structure for AI quiz generation

- [X] T001 Install new dependencies: `npm install officeparser jsdom @mozilla/readability robots-parser`
- [X] T002 Install dev dependencies: `npm install -D @types/jsdom`
- [X] T003 [P] Add LLM_KEY_ENCRYPTION_SECRET to .env.example
- [X] T004 [P] Create Zod schemas for LLM features in src/lib/validation/llmSchemas.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core LLM infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Migration

- [X] T005 Add LLMSettings model to prisma/schema.prisma
- [X] T006 Add generatedFrom field to Quiz model in prisma/schema.prisma
- [X] T007 Run database migration: `npx prisma migrate dev --name add-llm-settings`

### LLM Provider Abstraction

- [X] T008 [P] Create LLM types and interfaces in src/lib/llm/types.ts
- [X] T009 [P] Create LLM error handling in src/lib/llm/errors.ts
- [X] T010 Implement OpenAI provider in src/lib/llm/providers/openai.ts
- [X] T011 Implement Anthropic provider in src/lib/llm/providers/anthropic.ts
- [X] T012 Create provider factory and encryption utils in src/lib/llm/client.ts
- [X] T013 Create quiz generation prompts in src/lib/llm/prompts.ts

### LLM Settings API

- [X] T014 Implement GET/PUT /api/llm/settings in src/app/api/llm/settings/route.ts
- [X] T015 Implement POST /api/llm/test-connection in src/app/api/llm/test-connection/route.ts

### LLM Settings UI

- [X] T016 Create LLMSettings component in src/components/settings/LLMSettings.tsx
- [X] T017 Update settings page with LLM section in src/app/(host)/host/settings/page.tsx

### Unit Tests for Foundation

- [X] T018 [P] Unit tests for LLM provider abstraction in tests/unit/llm-provider.test.ts
- [X] T019 [P] Unit tests for LLM validation schemas in tests/unit/llm-validation.test.ts

**Checkpoint**: LLM infrastructure ready - host can configure and test LLM connection

---

## Phase 3: User Story 1 - Generate Quiz from Topic (Priority: P1) 🎯 MVP

**Goal**: Host enters a topic, specifies question count and difficulty, generates quiz

**Independent Test**: Enter "World War II History", 5 questions, Easy difficulty → Get 5 MCQ questions

### Implementation for User Story 1

- [X] T020 [US1] Create AIWizard main container in src/components/quiz/AIWizard.tsx
- [X] T021 [US1] Create SourceSelector (tabs) in src/components/quiz/SourceSelector.tsx
- [X] T022 [US1] Create GenerationOptions (count, difficulty) in src/components/quiz/GenerationOptions.tsx
- [X] T023 [US1] Create GeneratedQuestions (review/edit question text, options, correct answer per FR-010) in src/components/quiz/GeneratedQuestions.tsx
- [X] T024 [US1] Create TokenUsageSummary in src/components/quiz/TokenUsageSummary.tsx
- [X] T025 [US1] Implement topic generation endpoint in src/app/api/quizzes/generate/route.ts
- [X] T026 [US1] Create quiz creation page with AI wizard in src/app/(host)/host/quizzes/new/page.tsx
- [X] T027 [US1] Add "not configured" prompt when LLM settings missing

**Checkpoint**: User Story 1 complete - host can generate quiz from topic

---

## Phase 4: User Story 4 - Edit Generated Quiz Time Limits (Priority: P1) 🎯 MVP

**Goal**: Host can edit time limits per question (10-120s) before saving quiz

**Independent Test**: Generate 5 questions, change Q1 to 20s, Q3 to 60s, save → Verify saved values

### Implementation for User Story 4

- [X] T028 [US4] Add time limit editor to GeneratedQuestions component in src/components/quiz/GeneratedQuestions.tsx
- [X] T029 [US4] Add time limit presets (15s, 20s, 30s, 45s, 60s, 90s, 120s) with custom input
- [X] T030 [US4] Ensure time limits persist when saving quiz via existing POST /api/quizzes

**Checkpoint**: User Stories 1 + 4 complete - MVP ready (topic generation with time editing)

---

## Phase 5: User Story 2 - Generate Quiz from Document (Priority: P2)

**Goal**: Host uploads PDF/TXT/DOCX/PPTX, extracts content, generates quiz

**Independent Test**: Upload 2-page PDF about climate change, 8 questions → Get 8 relevant MCQs

### Parsing Implementation

- [X] T031 [P] [US2] Create document parsing module in src/lib/parsing/document.ts
- [X] T032 [P] [US2] Create unified parsing interface in src/lib/parsing/index.ts

### UI and API

- [X] T033 [US2] Create DocumentUpload component in src/components/quiz/DocumentUpload.tsx
- [X] T034 [US2] Add document source tab to SourceSelector in src/components/quiz/SourceSelector.tsx
- [X] T035 [US2] Update generation endpoint for document source in src/app/api/quizzes/generate/document/route.ts
- [X] T036 [US2] Add file validation (10MB max, supported formats)

### Unit Tests

- [X] T037 [P] [US2] Unit tests for document parsing in tests/unit/document-parsing.test.ts

**Checkpoint**: User Story 2 complete - host can generate quiz from uploaded documents

---

## Phase 6: User Story 3 - Generate Quiz from URL (Priority: P3)

**Goal**: Host enters URL, extracts article content, generates quiz

**Independent Test**: Enter Wikipedia "Solar System" URL, 6 questions → Get 6 relevant MCQs

### Parsing Implementation

- [X] T038 [P] [US3] Create URL content extraction in src/lib/parsing/url.ts
- [X] T039 [P] [US3] Add robots.txt compliance check

### UI and API

- [X] T040 [US3] Create URLInput component with preview in src/components/quiz/URLInput.tsx
- [X] T041 [US3] Add URL source tab to SourceSelector in src/components/quiz/SourceSelector.tsx
- [X] T042 [US3] Create generation endpoint for URL source in src/app/api/quizzes/generate/url/route.ts
- [X] T043 [US3] Add URL validation and accessibility check in src/app/api/quizzes/generate/url/check/route.ts

### Unit Tests

- [X] T044 [P] [US3] Unit tests for URL extraction in tests/unit/url-extraction.test.ts

**Checkpoint**: User Story 3 complete - host can generate quiz from URLs

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements across all user stories

- [X] T045 [P] E2E test for AI quiz generation flow in tests/e2e/ai-quiz-generation.spec.ts
- [X] T046 [P] Add loading states and cancel button to AIWizard
- [X] T047 [P] Add error handling and retry UI for generation failures
- [X] T048 Verify existing manual quiz creation still works (FR-015)
- [X] T049 Run quickstart.md validation - test all documented flows
- [X] T050 Update README with AI generation feature documentation

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────────┐
                                 ↓
Phase 2: Foundational ───────────┤ (BLOCKS all user stories)
                                 ↓
         ┌───────────────────────┴───────────────────────┐
         ↓                       ↓                       ↓
Phase 3: US1 (P1)          Phase 5: US2 (P2)       Phase 6: US3 (P3)
         ↓                       ↓                       ↓
Phase 4: US4 (P1)                │                       │
         ↓                       │                       │
    MVP Complete ────────────────┴───────────────────────┘
                                 ↓
                        Phase 7: Polish
```

### User Story Dependencies

- **US1 + US4**: Core MVP - can be delivered independently
- **US2**: Can run in parallel with US1/US4 after Foundational complete
- **US3**: Can run in parallel with US1/US4/US2 after Foundational complete

### Parallel Opportunities per Phase

**Phase 1 (Setup)**:
```
T003 (env) ──┬── T004 (schemas)
             └── parallel
```

**Phase 2 (Foundational)**:
```
T008 (types) ──┬── T009 (errors)
               └── parallel

T018 (llm tests) ──┬── T019 (validation tests)
                   └── parallel
```

**Phase 5 (US2)**:
```
T031 (document parsing) ──┬── T032 (interface)
                          └── parallel
```

**Phase 6 (US3)**:
```
T038 (url extraction) ──┬── T039 (robots.txt)
                        └── parallel
```

---

## Implementation Strategy

### MVP First (US1 + US4)

1. Complete Phase 1: Setup (~10 min)
2. Complete Phase 2: Foundational (~2 hours)
3. Complete Phase 3: US1 - Topic Generation (~1 hour)
4. Complete Phase 4: US4 - Time Editing (~30 min)
5. **STOP and VALIDATE**: Test topic generation with time editing
6. Deploy/demo MVP

### Full Feature Delivery

7. Complete Phase 5: US2 - Document Upload (~1 hour)
8. Complete Phase 6: US3 - URL Extraction (~1 hour)
9. Complete Phase 7: Polish (~30 min)
10. Final validation and deployment

---

## Task Summary

| Phase | Tasks | Parallel Tasks | Estimated Time |
|-------|-------|----------------|----------------|
| Setup | 4 | 2 | 10 min |
| Foundational | 15 | 4 | 2 hours |
| US1 (Topic) | 8 | 0 | 1 hour |
| US4 (Time Edit) | 3 | 0 | 30 min |
| US2 (Document) | 7 | 3 | 1 hour |
| US3 (URL) | 7 | 3 | 1 hour |
| Polish | 6 | 3 | 30 min |
| **Total** | **50** | **15** | **~6 hours** |
