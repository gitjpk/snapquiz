# Data Model: AI Quiz Generation Assistant

**Feature**: 004-ai-quiz-generation  
**Date**: 2026-01-27  
**Spec Reference**: [spec.md](spec.md)

---

## Entity Overview

```
┌─────────────────────┐      ┌─────────────────────┐
│    LLMSettings      │      │        Quiz         │
│  (per-host config)  │      │   (existing model)  │
├─────────────────────┤      ├─────────────────────┤
│ id                  │      │ id                  │
│ hostId (unique)     │      │ title               │
│ provider            │      │ description         │
│ apiEndpoint         │      │ generatedFrom? ─────┼──► Generation metadata
│ apiKey (encrypted)  │      │ ownerHostId         │
│ detectedModel?      │      └─────────────────────┘
│ createdAt           │
│ updatedAt           │
└─────────────────────┘
```

---

## Database Schema (Prisma)

### New Model: LLMSettings

Stores host-configured LLM connection settings. One per host (unique constraint).

```prisma
// =====================================================
// AI Quiz Generation (Feature 004)
// Reference: specs/004-ai-quiz-generation/data-model.md
// =====================================================

// LLMSettings - Host's LLM API configuration
model LLMSettings {
  id            String   @id @default(cuid())
  hostId        String   @unique // Only one config per host
  provider      String   // 'openai' | 'anthropic'
  apiEndpoint   String   // Custom endpoint URL
  apiKey        String   // Encrypted API key
  detectedModel String?  // Auto-detected model name from API
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([hostId])
}
```

### Extended Model: Quiz

Add optional generation metadata to track AI-assisted quiz creation.

```prisma
model Quiz {
  // ... existing fields ...
  
  // AI Generation metadata (null if manually created)
  generatedFrom   String?  // JSON: { sourceType, difficulty, questionCount, tokenUsage }
}
```

**generatedFrom JSON Schema**:
```typescript
interface QuizGenerationMetadata {
  sourceType: 'topic' | 'document' | 'url';
  sourceValue: string;       // Topic text, filename, or URL
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
  generatedAt: string;       // ISO timestamp
}
```

---

## Domain Types (TypeScript)

### LLM Configuration

```typescript
// src/lib/llm/types.ts

export type LLMProviderType = 'openai' | 'anthropic';

export interface LLMSettingsData {
  id: string;
  hostId: string;
  provider: LLMProviderType;
  apiEndpoint: string;
  apiKey: string;           // Decrypted for use
  detectedModel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LLMSettingsInput {
  provider: LLMProviderType;
  apiEndpoint: string;
  apiKey: string;
}

export interface LLMConnectionTestResult {
  success: boolean;
  modelName?: string;        // Detected model on success
  error?: string;            // Error message on failure
}
```

### Quiz Generation

```typescript
// src/lib/llm/generation.ts

export type GenerationSourceType = 'topic' | 'document' | 'url';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface GenerationSource {
  type: GenerationSourceType;
  value: string;             // Topic text, filename, or URL
  content?: string;          // Extracted text content (for document/URL)
}

export interface GenerationOptions {
  source: GenerationSource;
  questionCount: number;     // 1-20
  difficulty: DifficultyLevel;
}

export interface GeneratedQuestion {
  prompt: string;
  options: string[];         // Exactly 4
  correctOptionIndex: number; // 0-3
  timeLimitSeconds: number;  // Default 30, editable 10-120
  explanation?: string;      // From LLM for review
}

export interface GenerationResult {
  questions: GeneratedQuestion[];
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  warnings?: string[];       // e.g., "Only generated 8 of 10 requested questions"
}
```

---

## Validation Rules

### LLMSettings

| Field | Validation |
|-------|------------|
| provider | Must be `'openai'` or `'anthropic'` |
| apiEndpoint | Valid HTTPS URL, max 500 chars |
| apiKey | Non-empty string, max 500 chars |

### Generation Request

| Field | Validation |
|-------|------------|
| questionCount | Integer, 1-20 |
| difficulty | `'easy'`, `'medium'`, or `'hard'` |
| source.type | `'topic'`, `'document'`, or `'url'` |
| source.value (topic) | Non-empty string, max 1000 chars |
| source.value (url) | Valid HTTP/HTTPS URL |
| source.content (document) | Max 10MB file, supported formats |

### Generated Question

| Field | Validation |
|-------|------------|
| prompt | Non-empty, max 500 chars |
| options | Exactly 4 non-empty strings, max 200 chars each |
| correctOptionIndex | Integer 0-3, must be valid index |
| timeLimitSeconds | Integer 10-120, default 30 |

---

## State Transitions

### Quiz Generation Flow

```
[No LLM Config] → configure → [LLM Configured]
                                    │
                                    ↓
[Select Source] → upload/enter → [Source Ready]
                                    │
                                    ↓
[Set Options] → generate → [Generating...] → [Questions Ready]
                                                   │
                                                   ↓
                            [Edit Questions] → save → [Quiz Created]
                                    ↑               │
                                    └───────────────┘
                                       (edit more)
```

### LLM Connection States

```
[Not Configured] → save settings → [Testing...] → success → [Connected]
                                       │
                                       └─ failure → [Error State]
                                                        │
                                                        ↓
                                                    [Retry Available]
```

---

## Data Flow

### Settings Configuration

1. Host navigates to Settings page
2. Host enters: provider, endpoint, API key
3. On save: encrypt API key, store in DB
4. Test connection: call provider's models endpoint
5. On success: store detected model name
6. Display connection status to host

### Quiz Generation

1. Check LLM settings exist (redirect to settings if not)
2. Host selects source type and provides input
3. For document: extract text with officeparser
4. For URL: extract text with Readability
5. Build prompt with source content, count, difficulty
6. Call LLM provider
7. Parse structured JSON response
8. Display generated questions with token usage
9. Host edits questions/time limits
10. Save as Quiz with generatedFrom metadata

---

## Migration Notes

### Required Changes

1. **Add LLMSettings table** - New table for LLM configuration
2. **Add generatedFrom to Quiz** - Optional column for generation metadata

### Migration SQL

```sql
-- Add LLMSettings table
CREATE TABLE "LLMSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "hostId" TEXT NOT NULL UNIQUE,
  "provider" TEXT NOT NULL,
  "apiEndpoint" TEXT NOT NULL,
  "apiKey" TEXT NOT NULL,
  "detectedModel" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "LLMSettings_hostId_idx" ON "LLMSettings"("hostId");

-- Add generation metadata to Quiz
ALTER TABLE "Quiz" ADD COLUMN "generatedFrom" TEXT;
```

---

## Security Notes

- **API Key Storage**: Encrypt with a server-side key before storing in DB
- **API Key Display**: Never return full API key to client; show masked version (e.g., `sk-...abc123`)
- **API Key Transmission**: Accept key only over HTTPS
- **Host Isolation**: Each host can only access their own LLMSettings
