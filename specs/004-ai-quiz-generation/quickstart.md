# Quickstart: AI Quiz Generation Assistant

**Feature**: 004-ai-quiz-generation  
**Estimated Time**: ~3-4 hours implementation

---

## Prerequisites

1. SnapQuiz app running with host authentication (spec 002)
2. LLM API access (OpenAI or Anthropic account)
3. Node.js 22+ with npm

---

## Quick Setup

### 1. Install Dependencies

```bash
npm install officeparser jsdom @mozilla/readability robots-parser
npm install -D @types/jsdom
```

### 2. Run Database Migration

```bash
npx prisma migrate dev --name add-llm-settings
```

### 3. Add Encryption Key to Environment

```bash
# .env
LLM_KEY_ENCRYPTION_SECRET="your-32-char-secret-here"
```

---

## Implementation Order

### Phase 1: LLM Infrastructure (~1 hour)

1. **Create LLM types** - `src/lib/llm/types.ts`
   - Define interfaces: `LLMProvider`, `LLMMessage`, `LLMCompletionResult`, `LLMUsage`
   - Define error types: `LLMError`, `LLMErrorCode`

2. **Implement provider abstraction** - `src/lib/llm/providers/`
   - `openai.ts`: Implement OpenAI provider
   - `anthropic.ts`: Implement Anthropic provider
   - Use native fetch (no SDK dependencies)

3. **Create provider factory** - `src/lib/llm/client.ts`
   - Factory function to create provider from settings
   - API key encryption/decryption utilities

### Phase 2: LLM Settings UI (~30 min)

4. **Add settings API** - `src/app/api/llm/settings/route.ts`
   - GET: Return settings (masked API key)
   - PUT: Save settings with connection validation

5. **Update settings page** - `src/app/(host)/host/settings/page.tsx`
   - Add LLM configuration section
   - Provider dropdown, endpoint input, API key input
   - Test connection button
   - Display detected model

### Phase 3: Document Parsing (~30 min)

6. **Create parsing utilities** - `src/lib/parsing/`
   - `document.ts`: Extract text from PDF/DOCX/PPTX using officeparser
   - `url.ts`: Extract text from URL using Readability
   - `index.ts`: Unified interface

### Phase 4: Quiz Generation (~1 hour)

7. **Create generation prompts** - `src/lib/llm/prompts.ts`
   - System prompt with JSON schema
   - Few-shot examples
   - Difficulty mapping

8. **Add generation API** - `src/app/api/quizzes/generate/route.ts`
   - Handle multipart form (file upload)
   - Extract content based on source type
   - Call LLM and parse response
   - Return generated questions with token usage

### Phase 5: AI Wizard UI (~1 hour)

9. **Create wizard components** - `src/components/quiz/`
   - `AIWizard.tsx`: Main wizard container
   - `SourceSelector.tsx`: Topic/Document/URL tabs
   - `DocumentUpload.tsx`: File upload with drag-drop
   - `GenerationOptions.tsx`: Question count, difficulty
   - `GeneratedQuestions.tsx`: Review/edit questions
   - `TokenUsageSummary.tsx`: Display token usage

10. **Create quiz creation page** - `src/app/(host)/host/quizzes/new/page.tsx`
    - Tab: Manual creation (existing)
    - Tab: AI Assistant (new wizard)

---

## Verification Commands

```bash
# Run unit tests
npm test -- --grep "llm|parsing|generation"

# Run e2e tests
npm run test:e2e -- ai-quiz-generation.spec.ts

# Start dev server and test manually
npm run dev
# Navigate to /host/settings → Configure LLM
# Navigate to /host/quizzes/new → Try AI generation
```

---

## Key Files Created

```
src/
├── lib/
│   ├── llm/
│   │   ├── types.ts          # LLM interfaces and types
│   │   ├── errors.ts         # LLM error handling
│   │   ├── prompts.ts        # Quiz generation prompts
│   │   ├── client.ts         # Provider factory
│   │   └── providers/
│   │       ├── openai.ts     # OpenAI implementation
│   │       └── anthropic.ts  # Anthropic implementation
│   └── parsing/
│       ├── document.ts       # PDF/DOCX/PPTX parsing
│       ├── url.ts            # URL content extraction
│       └── index.ts          # Unified interface
├── app/
│   ├── api/
│   │   ├── llm/
│   │   │   ├── settings/
│   │   │   │   └── route.ts  # GET/PUT LLM settings
│   │   │   └── test-connection/
│   │   │       └── route.ts  # POST test connection
│   │   └── quizzes/
│   │       └── generate/
│   │           └── route.ts  # POST generate quiz
│   └── (host)/
│       └── host/
│           ├── settings/
│           │   └── page.tsx  # Updated with LLM section
│           └── quizzes/
│               └── new/
│                   └── page.tsx  # Quiz creation with AI wizard
└── components/
    ├── quiz/
    │   ├── AIWizard.tsx
    │   ├── SourceSelector.tsx
    │   ├── DocumentUpload.tsx
    │   ├── GenerationOptions.tsx
    │   ├── GeneratedQuestions.tsx
    │   └── TokenUsageSummary.tsx
    └── settings/
        └── LLMSettings.tsx

tests/
├── unit/
│   ├── llm-provider.test.ts
│   ├── document-parsing.test.ts
│   └── llm-validation.test.ts
└── e2e/
    └── ai-quiz-generation.spec.ts
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| "LLM settings not configured" | Navigate to /host/settings and configure LLM |
| "Connection failed" | Check API endpoint and key; verify network access |
| "Document parsing failed" | Ensure file is not password-protected; try different format |
| "URL fetch failed" | Check URL accessibility; site may block scraping |
| "Fewer questions generated" | Source content may be insufficient; try longer content |

---

## Next Steps

After implementation:
1. Run full test suite: `npm test && npm run test:e2e`
2. Verify all user stories from spec.md
3. Test with real LLM provider
4. Update documentation if needed
