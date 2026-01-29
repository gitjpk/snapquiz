# Implementation Plan: AI Quiz Generation Assistant

**Branch**: `004-ai-quiz-generation` | **Date**: 2026-01-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-ai-quiz-generation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

AI-powered quiz generation assistant allowing hosts to create quizzes from topics, documents (PDF/TXT/DOCX/PPTX), or URLs. Host configures their own LLM API (OpenAI/Anthropic) with connection validation. Features global difficulty selection (Easy/Medium/Hard), per-question time limit editing, and post-generation token usage display. Documents are sent directly to LLM without storage.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22+  
**Primary Dependencies**: Next.js 15 (App Router), React 19, Prisma 6, Zod, Socket.io  
**New Dependencies**: officeparser (PDF/DOCX/PPTX), jsdom, @mozilla/readability, robots-parser (native fetch for LLM APIs)  
**Storage**: SQLite via Prisma (existing), LLM settings stored per-host  
**Testing**: Vitest (unit), Playwright (e2e)  
**Target Platform**: Web (desktop + mobile responsive)  
**Project Type**: Web application (Next.js monolith)  
**Performance Goals**: Document parsing <10s for 5MB, URL extraction <5s, UI response <30s excluding LLM time  
**Constraints**: Max 10MB document upload, 1-20 questions, 10-120s time limits  
**Scale/Scope**: Single host system (existing auth), moderate usage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Accessible, Responsive UX | ✅ PASS | Form inputs labeled, keyboard navigation, visible focus states, mobile responsive |
| II. Secure-by-Default | ✅ PASS | API key stored in DB (encrypted), server-side validation, no credentials in repo |
| III. Dynamic Data First-Class | ✅ PASS | Clear API boundaries, LLM service abstraction, Prisma for persistence |
| IV. Reliability and Clear Failures | ✅ PASS | Error handling for LLM/parsing failures, user-friendly messages, retry options |
| V. Keep It Simple | ✅ PASS | Provider abstraction justified (OpenAI/Anthropic), no unnecessary complexity |

**Minimum Product Requirements**:
- ✅ Routing: New routes `/host/quizzes/new` (wizard), `/host/settings` (LLM config)
- ✅ Dynamic content: LLM settings loaded from DB, generated questions displayed
- ✅ Mutations: Quiz creation, LLM settings save with validation
- ✅ Auth: Requires host authentication (existing middleware)
- ✅ Input validation: Zod schemas for all inputs, server-side validation
- ✅ Security: XSS prevention (existing sanitization), parameterized queries (Prisma)
- ✅ Accessibility: Labeled inputs, semantic HTML, keyboard navigation
- ✅ Observability: Server-side logging for LLM calls/errors

**Quality Gates**:
- ✅ Build: Must pass
- ✅ Lint/format: Must pass
- ✅ Tests: Unit tests for LLM service, document parsing, validation; E2E smoke test for generation flow

### Post-Design Re-evaluation (2026-01-27)

All gates continue to pass after Phase 1 design:
- ✅ Data model adds LLMSettings with proper encryption for API keys
- ✅ API contracts follow existing patterns (REST, Zod validation, error codes)
- ✅ Documents sent directly to LLM (not stored) per user clarification
- ✅ No new external dependencies beyond necessary parsing/extraction libraries

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-quiz-generation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (host)/
│   │   └── host/
│   │       ├── quizzes/
│   │       │   └── new/
│   │       │       └── page.tsx         # Quiz creation with AI wizard
│   │       └── settings/
│   │           └── page.tsx             # Extended with LLM settings section
│   └── api/
│       ├── llm/
│       │   ├── settings/
│       │   │   └── route.ts             # GET/PUT LLM configuration
│       │   └── test-connection/
│       │       └── route.ts             # POST test LLM connection
│       └── quizzes/
│           └── generate/
│               └── route.ts             # POST generate quiz from source
├── components/
│   ├── quiz/
│   │   ├── AIWizard.tsx                 # Main AI generation wizard
│   │   ├── SourceSelector.tsx           # Topic/Document/URL tabs
│   │   ├── DocumentUpload.tsx           # File upload component
│   │   ├── URLInput.tsx                 # URL input with preview
│   │   ├── GenerationOptions.tsx        # Question count, difficulty
│   │   ├── GeneratedQuestions.tsx       # Review/edit generated questions
│   │   └── TokenUsageSummary.tsx        # Post-generation token display
│   └── settings/
│       └── LLMSettings.tsx              # LLM configuration form
└── lib/
    ├── llm/
    │   ├── provider.ts                  # Abstract LLM provider interface
    │   ├── openai.ts                    # OpenAI implementation
    │   ├── anthropic.ts                 # Anthropic implementation
    │   ├── prompts.ts                   # Quiz generation prompts
    │   └── client.ts                    # Factory to get configured provider
    ├── parsing/
    │   ├── pdf.ts                       # PDF text extraction
    │   ├── docx.ts                      # DOCX text extraction
    │   ├── pptx.ts                      # PPTX text extraction
    │   ├── url.ts                       # URL content extraction
    │   └── index.ts                     # Unified parsing interface
    └── validation/
        └── llmSchemas.ts                # Zod schemas for LLM features

tests/
├── unit/
│   ├── llm-provider.test.ts
│   ├── document-parsing.test.ts
│   └── llm-validation.test.ts
└── e2e/
    └── ai-quiz-generation.spec.ts
```

**Structure Decision**: Extends existing Next.js monolith structure. New `lib/llm/` for LLM abstraction, `lib/parsing/` for document processing, `components/quiz/` for wizard UI components.

## Complexity Tracking

> No constitution violations requiring justification. All principles satisfied with straightforward implementation.
