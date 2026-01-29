# Research: Host Password Protection

**Feature**: 002-host-password-protection  
**Date**: 2026-01-27

## Technology Decisions

### 1. Password Hashing Algorithm

**Decision**: bcrypt with cost factor 12

**Rationale**:
- Industry standard for password hashing (FR-002, SC-004)
- Built-in salt generation prevents rainbow table attacks
- Cost factor 12 provides good balance between security and performance (~250ms hash time)
- Widely audited and trusted in production systems

**Alternatives Considered**:
| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| argon2 | Memory-hard, more modern | Requires native bindings, more complex setup | Added complexity for MVP with no significant benefit |
| scrypt | Memory-hard | Less tooling support in Node.js | Ecosystem maturity |
| PBKDF2 | Built into Node crypto | Weaker against GPU attacks | Security concerns |

**Implementation**: Use `bcrypt` npm package (pure JS, no native deps)

### 2. Session Token Strategy

**Decision**: JWT stored in HTTP-only cookie

**Rationale**:
- HTTP-only cookie prevents XSS token theft (FR-009)
- JWT contains expiration, no server-side session storage needed
- Automatic cookie handling by browser simplifies client code
- 24-hour expiration matches requirement (FR-004)

**Alternatives Considered**:
| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| Server-side sessions | Revocation is immediate | Requires session store (Redis/DB) | Added infrastructure complexity |
| localStorage JWT | Simple client handling | Vulnerable to XSS | Security risk |
| API key header | Stateless | Must store/send manually | UX complexity for browser |

**Implementation**: Use `jose` library for JWT (pure JS, standards-compliant)

### 3. Rate Limiting Approach

**Decision**: In-memory rate limiter per IP

**Rationale**:
- Simple implementation for single-server MVP
- 5 attempts/minute/IP matches requirement (FR-010)
- No external dependencies (Redis not needed)
- Existing `rateLimit.ts` pattern in codebase

**Alternatives Considered**:
| Option | Pros | Cons | Why Rejected |
|--------|------|------|--------------|
| Redis rate limiter | Distributed, persistent | Requires Redis setup | Overkill for MVP |
| Upstash Rate Limit | Serverless-friendly | External dependency, cost | Not needed for self-hosted |

**Implementation**: Extend existing `src/lib/api/rateLimit.ts`

### 4. Route Protection Strategy

**Decision**: Next.js middleware + API route guards

**Rationale**:
- Middleware protects page routes at edge (fast redirects)
- API route guards provide defense-in-depth
- Follows Next.js App Router best practices
- Clear separation: middleware for pages, guards for API

**Implementation**:
- `middleware.ts` at repo root for `/host/*` page protection
- `src/lib/auth/middleware.ts` for API route guards

### 5. First-Run Setup Flow

**Decision**: Detect empty `HostCredential` table, redirect to setup page

**Rationale**:
- Matches spec assumption: "if no password exists, display setup form"
- No environment variable required for initial password
- Better UX than CLI-only setup
- Setup page only accessible when no credential exists

**Implementation**:
- Check `HostCredential` count on host area access
- If 0, redirect to `/host/setup` (one-time)
- After setup, `/host/setup` returns 404

## Security Considerations

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Brute force login | Rate limiting (5/min/IP) |
| Session hijacking | HTTP-only cookie, HTTPS in production |
| XSS token theft | HTTP-only cookie (not accessible via JS) |
| CSRF | SameSite=Lax cookie attribute |
| Password in logs | Never log password values, only hash presence |
| Timing attacks | bcrypt.compare is constant-time |

### Secrets Management

- JWT signing key: Generated randomly on first run, stored in `HostCredential.jwtSecret`
- Password: Never stored plaintext, only bcrypt hash
- No secrets in environment variables for MVP (self-contained)

## Dependencies to Add

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "jose": "^5.2.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2"
  }
}
```

## References

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [jose JWT Library](https://github.com/panva/jose)
