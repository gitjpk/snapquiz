# Data Model: Multi-Host Accounts

**Feature**: 005-multi-host-accounts  
**Date**: 2026-02-03  
**Status**: Ready for implementation

## Schema Changes

### Host (Modified)

The Host entity is expanded to store Microsoft identity information.

```prisma
model Host {
  id            String   @id @default(cuid())
  microsoftId   String   @unique  // Microsoft oid claim (primary identifier)
  email         String   @unique  // From Microsoft profile
  displayName   String?           // From Microsoft name claim
  createdAt     DateTime @default(now())
  lastLoginAt   DateTime @default(now())  // Updated on each login

  // Relations
  quizzes      Quiz[]
  llmSettings  LLMSettings?
  sessions     HostSession[]
}
```

**Changes from current**:
- Added `microsoftId` (unique, required)
- Added `email` (unique, required)  
- Added `lastLoginAt`
- Added relation to `HostSession`

### HostSession (Modified)

Add proper relation to Host for authorization.

```prisma
model HostSession {
  id        String    @id @default(cuid())
  hostId    String                      // NEW: Which host this session belongs to
  host      Host      @relation(fields: [hostId], references: [id], onDelete: Cascade)
  tokenId   String    @unique           // JWT jti claim
  createdAt DateTime  @default(now())
  expiresAt DateTime
  revokedAt DateTime?
  ipAddress String?
  userAgent String?

  @@index([hostId])
  @@index([tokenId])
  @@index([expiresAt])
}
```

**Changes from current**:
- Added `hostId` with FK to Host
- Added cascade delete

### HostCredential (REMOVED)

This table is removed entirely. Password authentication is replaced by Microsoft OAuth.

```prisma
// DELETED - No longer needed
// model HostCredential { ... }
```

### LLMSettings (Modified)

Add proper foreign key relation to Host.

```prisma
model LLMSettings {
  id            String   @id @default(cuid())
  hostId        String   @unique
  host          Host     @relation(fields: [hostId], references: [id], onDelete: Cascade)
  provider      String   // 'openai' | 'anthropic' | 'azure-foundry'
  apiEndpoint   String
  apiKey        String   // Encrypted
  model         String?
  detectedModel String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([hostId])
}
```

**Changes from current**:
- Added proper `host` relation (was just string reference)
- Added cascade delete

### Quiz (No schema change)

Already has `ownerHostId` field. Just ensure all queries filter by it.

```prisma
model Quiz {
  // ... existing fields ...
  ownerHostId String?
  ownerHost   Host?    @relation(fields: [ownerHostId], references: [id])
  // ... existing fields ...
}
```

**Note**: `ownerHostId` should become required (`String` not `String?`) after migration, but keeping nullable for backward compatibility during transition.

## Entity Relationships

```
Host (1) ──────┬──── (N) Quiz
               │
               ├──── (1) LLMSettings
               │
               └──── (N) HostSession

Quiz (1) ──────────── (N) LiveSession

LiveSession (1) ────── (N) Participant
```

## Migration Plan

### Step 1: Schema Update

```bash
# Update prisma/schema.prisma with changes above
```

### Step 2: Reset Database

Per FR-014, we do a clean reset (development/test data only):

```bash
npx prisma db push --force-reset
```

### Step 3: Seed Data (Optional)

No seed data needed - hosts are created on first OAuth login.

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| Host | `microsoftId` (unique) | Fast lookup by Microsoft ID |
| Host | `email` (unique) | Fast lookup by email |
| HostSession | `hostId` | Filter sessions by host |
| HostSession | `tokenId` (unique) | JWT validation |
| LLMSettings | `hostId` (unique) | One config per host |
| Quiz | `ownerHostId` | Filter quizzes by host |

## Validation Rules

| Field | Rule |
|-------|------|
| `Host.microsoftId` | Required, non-empty, from Microsoft `oid` claim |
| `Host.email` | Required, valid email format, from Microsoft |
| `Host.displayName` | Optional, max 255 chars |
| `HostSession.expiresAt` | Must be 7 days from creation |
