# SnapQuiz Constitution

## Core Principles

### I. Accessible, Responsive UX
The website must work on modern mobile + desktop screen sizes, with keyboard navigation, visible focus states, and reasonable contrast. All interactive controls must have labels; forms must show actionable validation errors.

### II. Secure-by-Default
All user input is treated as untrusted. Validate on the server, escape/encode output, and store secrets only in environment variables. No credentials/API keys in the repo.

### III. Dynamic Data is a First-Class Feature
The site must support dynamic content via server APIs (or server functions) with clear boundaries between UI, business logic, and persistence. Data reads/writes must be explicit, validated, and error-handled.

### IV. Reliability and Clear Failures
Failures must be predictable: return correct HTTP status codes, show user-friendly error states, and log server-side errors with enough context to debug (without logging secrets).

### V. Keep It Simple
Prefer the simplest implementation that meets requirements. Avoid premature abstractions; keep configuration minimal and documented.

## Minimum Product Requirements (Dynamic Website)

- **Routing**: Multiple pages/routes with consistent navigation.
- **Dynamic content**: At least one page that loads data from a server API (or server function) and renders it.
- **Mutations**: At least one form or interaction that writes data via a server API (create/update), with server-side validation.
- **Auth (if any user-specific data exists)**: Protected routes must require authentication; authorization checks must happen server-side.
- **Input validation**: Validate and normalize inputs server-side; reject invalid payloads with clear error messages.
- **Security basics**: Mitigate XSS (escape/encode), avoid SQL injection (parameterized queries/ORM), and protect state-changing requests from CSRF where applicable.
- **Performance basics**: Avoid loading unnecessary data; use pagination/limits for lists; include basic caching where appropriate.
- **Accessibility**: Keyboard operable, labeled inputs, accessible error messages, and semantic HTML.
- **Observability**: Server-side logs for requests/errors; do not log secrets or raw sensitive payloads.
- **Configuration**: All environment-specific values via env vars; provide an `.env.example` (no secrets).

## Quality Gates

- **Build**: `install → build` succeeds on a clean machine.
- **Lint/format**: Consistent formatting and linting; CI must fail on violations.
- **Tests (minimum)**:
	- Unit tests for core business logic.
	- A smoke test covering one critical end-to-end flow (e.g., load page → submit form → see result).
- **Error handling**: No unhandled promise rejections/exceptions in normal flows; user-visible errors must be actionable.

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

This constitution is the source of truth for minimum standards.

- Any change that weakens these requirements must include a rationale and migration plan.
- PRs should be reviewed for compliance with Security, Accessibility, and Quality Gates.
- If a requirement does not apply, the PR must explicitly document why.

**Version**: 1.0.0 | **Ratified**: 2026-01-20 | **Last Amended**: 2026-01-20
