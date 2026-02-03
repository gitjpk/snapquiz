# Research: Multi-Host Accounts with Microsoft Entra ID

**Feature**: 005-multi-host-accounts  
**Date**: 2026-02-03  
**Status**: Complete

## Research Tasks

### 1. Microsoft Entra ID / MSAL Integration

**Question**: What's the best approach to integrate Microsoft OAuth in a Next.js app?

**Finding**: Use `@azure/msal-node` for server-side OAuth flow (Authorization Code with PKCE).

**Decision**: Server-side OAuth flow via API routes
- `/api/auth/login` - Redirects to Microsoft
- `/api/auth/callback` - Handles OAuth callback
- `/api/auth/logout` - Clears session

**Rationale**: 
- Server-side is more secure (client secret stays on server)
- Works with existing JWT session pattern
- No client-side MSAL complexity

**Alternatives considered**:
- `@azure/msal-react` - Client-side, exposes tokens to browser
- NextAuth.js - Good but adds unnecessary abstraction for single provider
- `next-auth` with Azure provider - Overkill for our simple needs

### 2. OAuth Flow Implementation

**Question**: How to implement Authorization Code flow with MSAL Node?

**Finding**: MSAL Node provides `ConfidentialClientApplication` for server-side apps.

```typescript
import { ConfidentialClientApplication } from "@azure/msal-node";

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

// Login: Generate auth URL
const authUrl = await cca.getAuthCodeUrl({
  scopes: ["openid", "profile", "email"],
  redirectUri: `${BASE_URL}/api/auth/callback`,
});

// Callback: Exchange code for tokens
const response = await cca.acquireTokenByCode({
  code: authCode,
  scopes: ["openid", "profile", "email"],
  redirectUri: `${BASE_URL}/api/auth/callback`,
});
```

**Decision**: Use `ConfidentialClientApplication` with Authorization Code flow

**Rationale**: Standard secure flow, well-documented, handles token refresh

### 3. User Identity from Microsoft

**Question**: Which claims to use for user identification?

**Finding**: Microsoft ID tokens contain:
- `oid` - Object ID (unique per user, stable)
- `sub` - Subject (unique per app+user combination)
- `email` - User's email (may be null for some accounts)
- `preferred_username` - Usually email
- `name` - Display name

**Decision**: Use `oid` claim as primary identifier

**Rationale**:
- `oid` is globally unique and stable
- Works for both personal (MSA) and work/school (AAD) accounts
- `sub` changes if app registration changes

### 4. Session Management

**Question**: How to integrate OAuth with existing JWT session system?

**Finding**: After OAuth callback, create a local JWT session containing hostId.

**Decision**: 
1. OAuth callback extracts `oid`, `email`, `name` from ID token
2. Upsert Host record (create if new, update lastLoginAt if existing)
3. Create HostSession with hostId reference
4. Issue local JWT with `hostId` claim
5. Set HTTP-only cookie (existing pattern)

**Rationale**: Decouples Microsoft tokens from app sessions, allows 7-day expiry independent of Microsoft token lifetime

### 5. Database Migration Strategy

**Question**: How to handle existing data during migration?

**Finding**: Current schema has:
- `Host` with just `id` and `displayName`
- `HostCredential` for password auth
- `HostSession` for JWT sessions
- `LLMSettings` with `hostId` as string (not FK)

**Decision**: Clean migration (FR-014 specifies reset)
1. Add `microsoftId` and `email` to Host
2. Remove `HostCredential` table
3. Update `HostSession` to reference Host properly
4. Update `LLMSettings` to use proper Host FK
5. Run with `--force-reset` to clear existing data

**Rationale**: Per clarification, existing data is test data that can be deleted

### 6. API Route Authorization Pattern

**Question**: How to enforce host isolation in API routes?

**Finding**: Current `requireAuth()` returns `sessionId`. Need to also return `hostId`.

**Decision**: Updated pattern:
```typescript
interface AuthResult {
  authenticated: true;
  sessionId: string;
  hostId: string;  // NEW
}

// Usage in routes
const auth = await requireAuth();
if (auth instanceof NextResponse) return auth;

// All queries filter by hostId
const quizzes = await prisma.quiz.findMany({
  where: { ownerHostId: auth.hostId },
});
```

**Rationale**: Simple, explicit, easy to audit

### 7. Error Handling for OAuth Failures

**Question**: How to handle Microsoft Entra ID errors gracefully?

**Finding**: Common errors:
- `access_denied` - User cancelled
- `server_error` - Microsoft service issue
- Network errors

**Decision**: 
- Redirect to `/login?error=cancelled` if user cancels
- Redirect to `/login?error=unavailable` if service error
- Display user-friendly messages on login page

**Rationale**: Per FR-012, show clear error messages

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| OAuth Library | `@azure/msal-node` (server-side) |
| OAuth Flow | Authorization Code with PKCE |
| User ID | Microsoft `oid` claim |
| Session | Local JWT with `hostId`, 7-day expiry |
| Migration | Clean reset, remove password auth |
| Authorization | `requireAuth()` returns `hostId`, all queries filter |
| Errors | Redirect to login with error param |
