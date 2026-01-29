# Research: AI Quiz Generation Assistant

**Feature**: 004-ai-quiz-generation  
**Date**: 2026-01-27  
**Status**: Complete

## Overview

This document captures research decisions for implementing AI-powered quiz generation from topics, documents (PDF/TXT/DOCX/PPTX), and URLs with user-configurable LLM providers.

---

## 1. LLM Provider Abstraction

### Decision
Use a **provider-agnostic abstraction layer** with unified interfaces for completion, token counting, and model discovery. Factory pattern for instantiation.

### Rationale
- Both OpenAI and Anthropic share core concepts (messages, models, tokens) but differ in API shapes
- Clean interface hides provider differences, enables testing, and allows easy provider swapping
- User configures their own endpoint/API key, requiring flexible configuration

### Implementation

**Interface Design**:
```typescript
// src/lib/llm/types.ts
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  model: string;
  messages: LLMMessage[];
  maxTokens: number;
  temperature?: number;
}

export interface LLMCompletionResult {
  content: string;
  model: string;
  finishReason: 'stop' | 'length' | 'error';
  usage: LLMUsage;
}

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface LLMProvider {
  readonly name: 'openai' | 'anthropic';
  complete(options: LLMCompletionOptions): Promise<LLMCompletionResult>;
  listModels(): Promise<LLMModelInfo[]>;
}
```

**Error Normalization**:
- Unified `LLMError` class with codes: `authentication`, `rate_limited`, `invalid_request`, `server_error`, `overloaded`
- Map HTTP status codes to error codes consistently across providers
- Track `retryable` flag for 429/500/503/529 errors

**Token Usage Tracking**:
- OpenAI: `prompt_tokens`, `completion_tokens`, `total_tokens`
- Anthropic: `input_tokens`, `output_tokens`
- Normalize to: `{ inputTokens, outputTokens, totalTokens }`

**Model Detection**:
- OpenAI: `GET /v1/models` → `{ id, owned_by, created }`
- Anthropic: `GET /v1/models` → `{ id, display_name, created_at }`
- Unified response: `{ id, displayName, provider, createdAt }`

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| Single provider hardcoded | User requirement: configurable provider |
| Vercel AI SDK | Adds dependency; simpler to implement directly for two providers |
| LangChain | Overkill for quiz generation; significant bundle size |

---

## 2. Document Parsing Libraries

### Decision
Use **officeparser** as primary library for all document formats (PDF, DOCX, PPTX). Alternative: `pdf-parse` + `mammoth` for smaller bundle.

### Rationale
- Single library handles all required formats with consistent API
- In-memory processing (v6+ uses yauzl) - no temp files needed
- AST output preserves structure (headings, lists, tables) for better LLM context
- User clarification: Documents sent directly to LLM, not stored

### Implementation

**Installation**: `npm install officeparser`

**Usage**:
```typescript
import { parseOffice } from 'officeparser';

async function extractText(buffer: Buffer): Promise<string> {
  const ast = await parseOffice(buffer);
  return ast.toText(); // Plain text for LLM
}
```

**Error Handling**:
- Password-protected documents → "Document is password-protected"
- Corrupted files → "Document appears corrupted"
- Empty documents → "Document appears empty or unreadable"

**Security Considerations**:
- Validate file size (max 10MB) BEFORE parsing
- Verify magic bytes match claimed extension
- Set processing timeout to prevent zip bombs
- officeparser uses yauzl (safe from Zip Slip)

### Alternatives Considered
| Library | Rejected Because |
|---------|------------------|
| pdf.js-extract | PDF only, last updated 3 years ago |
| docx | Low-level XML parsing, more code needed |
| pptx-parser | PPTX only |

---

## 3. URL Content Extraction

### Decision
Use **jsdom + @mozilla/readability** for intelligent content extraction with **robots-parser** for ethical scraping.

### Rationale
- Readability (Firefox Reader View algorithm) automatically extracts main article content, removes ads/navigation
- jsdom provides full DOM implementation required by Readability
- robots-parser ensures compliance with site policies
- Puppeteer rejected: 300MB Chrome dependency overkill for text extraction

### Implementation

**Installation**: `npm install jsdom @mozilla/readability robots-parser`

**Content Extraction Flow**:
1. Fetch HTML with proper User-Agent (`SnapQuiz/1.0 (+https://yoursite.com/bot)`)
2. Check robots.txt before scraping
3. Parse with jsdom, extract with Readability
4. Return clean textContent + metadata (title, byline)

**Error Handling**:
| Error | User Message |
|-------|--------------|
| 404 | "This page doesn't exist" |
| 403 | "Access to this page is restricted" |
| Paywall detected | "This content requires login or subscription" |
| No content | "Not enough text content found for quiz generation" |

**Text Preprocessing**:
- Normalize whitespace and line endings
- Remove citation markers (`[1]`, `[edit]`)
- Truncate to ~15,000 chars for LLM token budget
- Validate minimum word count (50 words × requested questions)

**Ethical Guidelines**:
- 1s minimum delay between requests to same domain
- 10s request timeout
- Respect `Crawl-delay` directive
- Descriptive User-Agent

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| Puppeteer/Playwright | 300MB Chrome dependency, slow startup |
| cheerio alone | No intelligent content extraction; would get nav/ads |
| Jina Reader API | External dependency, cost, privacy concerns |

---

## 4. Quiz Generation Prompts

### Decision
Use **structured system prompt** with Role + JSON Schema + Few-Shot Examples + Self-Verification. Leverage provider's structured output feature when available.

### Rationale
- Structured outputs (OpenAI `response_format`, Anthropic tool use) guarantee valid JSON
- Few-shot examples dramatically improve question quality
- Difficulty mapped to Bloom's Taxonomy cognitive levels for consistent interpretation
- Self-verification checklist reduces errors

### Implementation

**Prompt Structure**:
```
SYSTEM:
  - Role: Expert quiz creator
  - Task description
  - Quality rules (single correct answer, no ambiguity, etc.)
  - Difficulty guidelines with Bloom's taxonomy mapping
  - Output JSON schema
  - Few-shot examples (2-3)
  - Self-verification checklist

USER:
  <source_type>{topic|document|url}</source_type>
  <content>{material}</content>
  <num_questions>{count}</num_questions>
  <difficulty>{easy|medium|hard}</difficulty>
```

**Difficulty Mapping (Bloom's Taxonomy)**:
| Level | Cognitive Level | Question Characteristics |
|-------|----------------|-------------------------|
| Easy | Remember/Understand | Recall facts, obvious answers, terminology |
| Medium | Apply/Analyze | Connect concepts, plausible distractors, context needed |
| Hard | Evaluate/Create | Subtle distinctions, inference required, expert knowledge |

**Output Schema** (Zod):
```typescript
const QuizGenerationSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    correctAnswer: z.number().min(0).max(3),
    explanation: z.string(), // Forces model to verify
    difficulty: z.enum(['easy', 'medium', 'hard']),
  })),
  tokenUsage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});
```

**Quality Control**:
1. Prompt rules: No trick questions, single correct answer, clear language
2. Required `explanation` field forces model to verify correctness
3. Self-verification checklist in prompt
4. Application-layer validation (correct index bounds, unique options)

**Context Window Management**:
- Content < limit → use as-is
- Content 1-2x limit → truncate at section/paragraph boundaries
- Content >> limit → summarize key points first
- Priority: intro, summary, key concepts sections

### Alternatives Considered
| Option | Rejected Because |
|--------|------------------|
| Plain text output | Parsing unreliable, JSON errors |
| XML output | Less tooling support than JSON |
| No examples | Significantly worse question quality |

---

## 5. Security Considerations Summary

| Risk | Mitigation |
|------|------------|
| API key exposure | Store encrypted in DB, never log, exclude from client bundle |
| Document zip bombs | Validate size before parsing, timeout processing |
| Malicious URLs | Validate URL format, robots.txt check, timeout fetch |
| XSS in generated content | Sanitize all LLM output before display |
| LLM injection | User content wrapped in XML tags, not interpolated into prompts |
| Rate limiting | Per-host rate limits on generation endpoint |

---

## Dependencies Summary

```json
{
  "dependencies": {
    "officeparser": "^6.0.0",
    "jsdom": "^24.0.0",
    "@mozilla/readability": "^0.5.0",
    "robots-parser": "^3.0.0"
  }
}
```

Note: OpenAI and Anthropic SDKs used via direct fetch to avoid large dependencies and allow custom endpoint support.
