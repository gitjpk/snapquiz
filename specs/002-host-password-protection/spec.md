# Feature Specification: Host Password Protection

**Feature Branch**: `002-host-password-protection`  
**Created**: 2026-01-27  
**Status**: Draft  
**Input**: User description: "Host content must be password protected"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Host Access with Password (Priority: P1)

As a host, I can protect my quiz management area with a password so that only authorized users can create, edit, or launch quizzes and sessions.

**Why this priority**: This is the core security feature that prevents unauthorized access to host functionality. Without it, anyone could manipulate quiz content or disrupt live sessions.

**Independent Test**: Access the host area without a password and verify access is denied; enter the correct password and verify full access to quiz management and session controls.

**Acceptance Scenarios**:

1. **Given** a user navigates to the host area, **When** they have not entered a password, **Then** they see a password prompt and cannot access host features.
2. **Given** a user is on the password prompt, **When** they enter the correct password, **Then** they gain access to the host dashboard and can manage quizzes.
3. **Given** a user is on the password prompt, **When** they enter an incorrect password, **Then** they see a clear error message and can retry.
4. **Given** a host has authenticated, **When** they close the browser and return later, **Then** their session persists for a reasonable duration (e.g., 24 hours) before requiring re-authentication.

---

### User Story 2 - Host Can Change Password (Priority: P2)

As a host, I can change the host password to maintain security over time.

**Why this priority**: Password rotation is a security best practice and allows recovery if the password is compromised.

**Independent Test**: Log in as host, navigate to settings, change the password, log out, and verify the new password works while the old one does not.

**Acceptance Scenarios**:

1. **Given** a host is authenticated, **When** they navigate to settings, **Then** they see an option to change the password.
2. **Given** a host is on the password change form, **When** they enter the current password and a valid new password, **Then** the password is updated and they see a confirmation.
3. **Given** a host is on the password change form, **When** they enter an incorrect current password, **Then** the change is rejected with a clear error.

---

### User Story 3 - Protected API Endpoints (Priority: P1)

As a system, host-only API endpoints must validate authentication before processing requests to prevent unauthorized modifications.

**Why this priority**: API-level protection is essential; UI-only protection can be bypassed. This ensures security at the data layer.

**Independent Test**: Call a host API endpoint (e.g., create quiz, start session) without valid credentials and verify the request is rejected with 401/403.

**Acceptance Scenarios**:

1. **Given** an unauthenticated request to a host endpoint, **When** the server processes it, **Then** it returns a 401 Unauthorized response.
2. **Given** an authenticated request with valid credentials, **When** the server processes it, **Then** the request proceeds normally.
3. **Given** a player-facing endpoint (e.g., join session), **When** an unauthenticated participant calls it, **Then** it works normally (participants do not need host credentials).

---

### Edge Cases

- Password is empty or whitespace-only (reject with validation error).
- Multiple failed login attempts in rapid succession (rate limiting applied).
- Host forgets password (recovery via CLI command: `npm run reset-password`).
- Session token expires mid-operation (graceful re-authentication prompt).
- Password contains special characters or unicode (handle encoding properly).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require password authentication before granting access to host features (quiz management, session control).
- **FR-002**: System MUST store the host password securely using a one-way hash with salt (e.g., bcrypt, argon2).
- **FR-003**: System MUST provide a login form that accepts a password and validates it against the stored hash.
- **FR-004**: System MUST issue a session token upon successful authentication that persists across page reloads.
- **FR-005**: System MUST protect all host-only API endpoints by validating the session token or API key.
- **FR-006**: System MUST return appropriate HTTP status codes (401 Unauthorized, 403 Forbidden) for unauthenticated/unauthorized requests.
- **FR-007**: System MUST allow an authenticated host to change the password by providing the current password and a new password.
- **FR-008**: System MUST enforce minimum password requirements (at least 8 characters).
- **FR-009**: System MUST NOT expose the password in logs, error messages, or API responses.
- **FR-010**: System MUST rate-limit login attempts to mitigate brute-force attacks (max 5 attempts per minute per IP).
- **FR-011**: System MUST provide a manual logout option that invalidates the current session token immediately.

### Assumptions

- MVP supports a single shared host password (not individual host accounts). Multi-tenant host accounts are out of scope for this feature.
- The initial host password is set via a first-run setup screen: if no password exists when the host area is accessed, the system displays a one-time setup form to create the initial password.
- Participants (players) do not need any authentication to join sessions.

## Clarifications

### Session 2026-01-27

- Q: Comment le mot de passe initial est-il défini (env var obligatoire vs first-run setup) ? → A: Écran de setup "first-run" si aucun mot de passe n'existe
- Q: Le host peut-il se déconnecter manuellement ou uniquement via expiration ? → A: Bouton "Logout" manuel + expiration automatique après 24h
- Q: Quel est le mécanisme de récupération si le host oublie son mot de passe ? → A: Commande CLI admin (`npm run reset-password`)

### Key Entities

- **HostSession**: Represents an authenticated host session; includes session token, creation time, and expiration time.
- **HostCredential**: Stores the hashed password; single row for MVP (shared host mode).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of host-only API endpoints reject unauthenticated requests with 401/403.
- **SC-002**: Host can log in successfully with correct password within 3 seconds.
- **SC-003**: Incorrect passwords are rejected with clear error feedback within 2 seconds.
- **SC-004**: Password hashing uses industry-standard algorithm (bcrypt/argon2) with appropriate work factor.
- **SC-005**: Rate limiting blocks more than 5 failed login attempts per minute from a single IP.
- **SC-006**: Session tokens remain valid for at least 24 hours, reducing friction for returning hosts.
