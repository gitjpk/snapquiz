# Implementation Plan: Host Password Protection

**Branch**: `002-host-password-protection` | **Date**: 2026-01-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-host-password-protection/spec.md`

## Summary

Implement password-based authentication for the host area to prevent unauthorized access to quiz management and session control features. Uses bcrypt for password hashing, HTTP-only cookies for session tokens, and middleware-based API protection.

## Technical Context

**Language/Version**: TypeScript (Node.js 20 LTS)  
**Primary Dependencies**: Next.js (App Router), bcrypt (password hashing), jose (JWT tokens)  
**Storage**: SQLite via Prisma (existing); adds `HostCredential` and `HostSession` tables  
**Testing**: Vitest (unit), Playwright (E2E)  
**Target Platform**: Web (modern browsers)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Login response <3s (SC-002), error feedback <2s (SC-003)  
**Constraints**: Rate limiting max 5 attempts/min/IP (FR-010), session TTL 24h (FR-004)  
**Scale/Scope**: Single shared host password (MVP), ~10 protected API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Accessible, Responsive UX | ✅ PASS | Login form with labels, validation errors, keyboard accessible |
| II. Secure-by-Default | ✅ PASS | bcrypt hashing, HTTP-only cookies, server-side validation |
| III. Dynamic Data | ✅ PASS | Clear auth API boundaries, explicit validation |
| IV. Reliability and Clear Failures | ✅ PASS | 401/403 status codes, actionable error messages |
| V. Keep It Simple | ✅ PASS | Single password (no user accounts), standard JWT pattern |

**Quality Gates**:
- Build: Existing Next.js build + new auth middleware
- Tests: Unit tests for hashing/validation, E2E for login flow
- Security: No secrets in logs, parameterized queries via Prisma

## Project Structure

### Documentation (this feature)

```text
specs/002-host-password-protection/
├── plan.md              # This file
├── research.md          # Technology decisions
├── data-model.md        # HostCredential, HostSession entities
├── quickstart.md        # Setup and testing guide
├── contracts/           # OpenAPI for auth endpoints
│   └── openapi.yaml
└── tasks.md             # Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (host)/
│   │   ├── layout.tsx           # MODIFY: Add auth check wrapper
│   │   ├── host/
│   │   │   └── settings/        # NEW: Password change page
│   │   │       └── page.tsx
│   │   ├── login/               # NEW: Login page
│   │   │   └── page.tsx
│   │   └── setup/               # NEW: First-run setup page
│   │       └── page.tsx
│   └── api/
│       └── auth/                # NEW: Auth API routes
│           ├── login/
│           │   └── route.ts
│           ├── logout/
│           │   └── route.ts
│           ├── setup/
│           │   └── route.ts
│           └── change-password/
│               └── route.ts
├── components/
│   └── auth/                    # NEW: Auth UI components
│       ├── LoginForm.tsx
│       ├── SetupForm.tsx
│       └── ChangePasswordForm.tsx
├── lib/
│   └── auth/                    # NEW: Auth utilities
│       ├── password.ts          # bcrypt hash/verify
│       ├── session.ts           # JWT create/validate
│       └── middleware.ts        # API protection
└── middleware.ts                # NEW: Next.js middleware for route protection

prisma/
└── schema.prisma                # MODIFY: Add HostCredential, HostSession

scripts/
└── reset-password.ts            # NEW: CLI for password reset

tests/
├── unit/
│   └── auth.test.ts             # NEW: Auth logic tests
└── e2e/
    └── host-auth.spec.ts        # NEW: Login flow E2E
```

**Structure Decision**: Extends existing Next.js App Router structure with new `/auth/` API routes and `/lib/auth/` utilities. Follows existing patterns from feature 001.

## Complexity Tracking

No constitution violations requiring justification.
