# Implementation Plan: Multi-Host Accounts

**Branch**: `005-multi-host-accounts` | **Date**: 2026-02-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-multi-host-accounts/spec.md`

## Summary

Transform SnapQuiz from a single-host application to a multi-host platform where each formateur (host) has an isolated space with their own quizzes, sessions, and LLM settings. Authentication via Microsoft Entra ID (OAuth 2.0) with automatic account creation on first login.

## Technical Context

**Language/Version**: TypeScript 5.7 / Node.js 20+  
**Primary Dependencies**: Next.js 15, React 19, Prisma 6, Socket.IO, jose (JWT)  
**Storage**: SQLite (development) → Azure-compatible  
**Testing**: Vitest (unit), Playwright (E2E)  
**Target Platform**: Web application (Azure App Service)  
**Project Type**: Web application (Next.js monolith with custom server)  
**Performance Goals**: <2s login/logout, 100 concurrent hosts  
**Constraints**: Session expiration 7 days, 403 for unauthorized access  
**Scale/Scope**: ~100 hosts, existing ~20 API routes to update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Accessible, Responsive UX | ✅ PASS | Existing UI patterns continue; Microsoft login button standard |
| II. Secure-by-Default | ✅ PASS | OAuth tokens via HTTP-only cookies, server-side validation, secrets in env vars |
| III. Dynamic Data First-Class | ✅ PASS | Clear Host→Quiz→Session relationships, Prisma ORM |
| IV. Reliability and Clear Failures | ✅ PASS | 403 for auth failures, clear error messages for Entra ID issues |
| V. Keep It Simple | ✅ PASS | Using standard MSAL library, minimal schema changes |

**Quality Gates**:
- Build: ✅ Must pass `npm run build`
- Lint/format: ✅ Must pass `npm run lint`
- Tests: ✅ Unit tests for auth logic, E2E for login flow
- Error handling: ✅ Graceful Entra ID failures, clear messages

## Project Structure

### Documentation (this feature)

```text
specs/005-multi-host-accounts/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: MSAL.js integration research
├── data-model.md        # Phase 1: Schema changes
├── quickstart.md        # Phase 1: Dev setup with Entra ID
└── contracts/           # Phase 1: API contract changes
    └── openapi.yaml     # Auth endpoints
```

### Source Code (existing structure)

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      # MODIFY: Redirect to Microsoft
│   │   │   ├── logout/route.ts     # MODIFY: Clear session
│   │   │   ├── status/route.ts     # MODIFY: Return host info
│   │   │   └── callback/route.ts   # NEW: Entra ID callback
│   │   ├── quizzes/                # MODIFY: Filter by hostId
│   │   ├── sessions/               # MODIFY: Filter by hostId
│   │   └── settings/               # MODIFY: Filter by hostId
│   ├── (host)/
│   │   └── host/                   # Protected routes (already exist)
│   └── login/
│       └── page.tsx                # NEW: Login page with Microsoft button
├── components/
│   └── auth/
│       └── MicrosoftLoginButton.tsx # NEW
├── lib/
│   ├── auth/
│   │   ├── session.ts              # MODIFY: Include hostId in JWT
│   │   ├── middleware.ts           # MODIFY: Return hostId from auth
│   │   └── msal.ts                 # NEW: MSAL configuration
│   └── db/
│       └── client.ts               # Existing Prisma client

prisma/
├── schema.prisma                   # MODIFY: Host entity changes
└── migrations/                     # NEW: Migration for Host changes

tests/
├── unit/
│   └── auth.test.ts                # NEW: Auth logic tests
└── e2e/
    └── login.spec.ts               # NEW: OAuth flow test
```

**Structure Decision**: Existing Next.js monolith structure maintained. New auth components added to existing patterns. No architectural changes needed.

## Complexity Tracking

No complexity violations. Using standard OAuth patterns with Microsoft's MSAL library.

## Dependencies

**New npm packages**:
- `@azure/msal-node` - Microsoft Auth Library for Node.js (server-side OAuth)

**Azure Portal Setup Required**:
- Register app in Microsoft Entra ID
- Configure redirect URIs (localhost + production)
- Get Client ID and Client Secret
- Add to environment variables

## Environment Variables (New)

```env
# Microsoft Entra ID (Azure AD)
AZURE_AD_CLIENT_ID=<from-azure-portal>
AZURE_AD_CLIENT_SECRET=<from-azure-portal>
AZURE_AD_TENANT_ID=common  # "common" accepts any Microsoft account
```
