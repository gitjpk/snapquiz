# Data Model: Host Password Protection

**Feature**: 002-host-password-protection  
**Date**: 2026-01-27

## Entity Overview

```
┌─────────────────────┐
│   HostCredential    │
├─────────────────────┤
│ id (PK)             │
│ passwordHash        │
│ jwtSecret           │
│ createdAt           │
│ updatedAt           │
└─────────────────────┘

┌─────────────────────┐
│    HostSession      │
├─────────────────────┤
│ id (PK)             │
│ tokenId             │
│ createdAt           │
│ expiresAt           │
│ revokedAt           │
│ ipAddress           │
│ userAgent           │
└─────────────────────┘
```

## Entities

### HostCredential

Stores the shared host password (single row for MVP).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| passwordHash | String | NOT NULL | bcrypt hash of host password |
| jwtSecret | String | NOT NULL | Random secret for JWT signing (256 bits) |
| createdAt | DateTime | NOT NULL, default now() | When credential was created |
| updatedAt | DateTime | NOT NULL, auto-update | When password was last changed |

**Validation Rules**:
- Only one row should exist (MVP single-host mode)
- Password must be at least 8 characters before hashing (FR-008)
- jwtSecret is generated randomly on first setup

**State Transitions**:
- `NULL` → `Created`: First-run setup creates initial credential
- `Created` → `Updated`: Password change updates hash and updatedAt

### HostSession

Tracks active host sessions for audit and optional revocation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| tokenId | String | NOT NULL, UNIQUE | JWT `jti` claim for revocation lookup |
| createdAt | DateTime | NOT NULL, default now() | When session was created |
| expiresAt | DateTime | NOT NULL | When session expires (24h from creation) |
| revokedAt | DateTime | NULL | When session was manually revoked (logout) |
| ipAddress | String | NULL | Client IP for audit |
| userAgent | String | NULL | Browser user agent for audit |

**Validation Rules**:
- tokenId must be unique (used for revocation check)
- expiresAt must be in the future when created

**State Transitions**:
- `NULL` → `Active`: Login creates new session
- `Active` → `Revoked`: Logout sets revokedAt
- `Active` → `Expired`: Time passes expiresAt (no DB change, checked on validate)

## Prisma Schema Additions

```prisma
// Host Password Protection - Single shared password for MVP
model HostCredential {
  id           String   @id @default(cuid())
  passwordHash String
  jwtSecret    String   // Random 256-bit secret for JWT signing
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// Host Session - Tracks active sessions for audit/revocation
model HostSession {
  id        String    @id @default(cuid())
  tokenId   String    @unique // JWT jti claim
  createdAt DateTime  @default(now())
  expiresAt DateTime
  revokedAt DateTime?
  ipAddress String?
  userAgent String?

  @@index([tokenId])
  @@index([expiresAt])
}
```

## Relationships

- `HostCredential` has no foreign keys (standalone)
- `HostSession` has no foreign keys (standalone, linked via JWT tokenId)
- Future: Could add `hostCredentialId` FK if multi-host support added

## Queries

### Common Access Patterns

| Operation | Query | Frequency |
|-----------|-------|-----------|
| Check if setup needed | `SELECT COUNT(*) FROM HostCredential` | Every host page load |
| Validate password | `SELECT passwordHash, jwtSecret FROM HostCredential LIMIT 1` | Login |
| Check session revoked | `SELECT revokedAt FROM HostSession WHERE tokenId = ?` | Every protected request |
| Create session | `INSERT INTO HostSession (...)` | Login |
| Revoke session | `UPDATE HostSession SET revokedAt = NOW() WHERE tokenId = ?` | Logout |

### Indexes

- `HostSession.tokenId` (UNIQUE) - Fast revocation lookup
- `HostSession.expiresAt` - Cleanup expired sessions

## Migration Notes

- New tables only, no changes to existing schema
- Safe to run on existing database
- No data migration needed
