# LLM Integration

This directory contains the LLM (Large Language Model) integration layer for AI-powered quiz generation.

## Architecture

```
llm/
├── client.ts           # Provider factory & encryption utilities
├── errors.ts           # Custom error types (LLMError, etc.)
├── prompts.ts          # Quiz generation prompts
├── types.ts            # TypeScript interfaces
└── providers/
    ├── azure-foundry.ts  # Azure AI Foundry (OpenAI-compatible)
    ├── openai.ts         # OpenAI API
    └── anthropic.ts      # Anthropic Claude API
```

## Supported Providers

### Azure AI Foundry

Primary provider for SnapQuiz. Supports models deployed in Azure AI Foundry:

- **Mistral-Large-3**: Fast, reliable JSON output
- **DeepSeek-V3.2**: Good quality, cost-effective
- **gpt-5.2-chat**: Latest GPT model

Uses OpenAI-compatible API format:
- Endpoint: `https://<resource>.services.ai.azure.com/openai/v1`
- Auth: `api-key` header

### OpenAI

Standard OpenAI API:
- Endpoint: `https://api.openai.com/v1`
- Auth: `Authorization: Bearer <key>`

### Anthropic

Claude models via Anthropic API:
- Endpoint: `https://api.anthropic.com`
- Auth: `x-api-key` header

## API Key Security

API keys are encrypted using **AES-256-GCM** before database storage:

```typescript
// Encryption flow
plaintext → encrypt(key, iv) → base64(iv + authTag + ciphertext)

// Decryption flow
base64 string → split(iv, authTag, ciphertext) → decrypt → plaintext
```

Requirements:
- `LLM_KEY_ENCRYPTION_SECRET` env variable (32 bytes, 64 hex chars)
- Unique random IV per encryption
- Authentication tag prevents tampering

## Usage

```typescript
import { getLLMProvider, encryptApiKey, decryptApiKey } from "@/lib/llm/client";

// Create provider from settings
const provider = getLLMProvider({
  provider: "azure-foundry",
  endpoint: "https://myresource.services.ai.azure.com/openai/v1",
  apiKey: "decrypted-key",
  model: "Mistral-Large-3"
});

// Generate quiz questions
const result = await provider.complete({
  messages: [
    { role: "system", content: QUIZ_SYSTEM_PROMPT },
    { role: "user", content: "Generate 5 questions about Python" }
  ],
  maxTokens: 4000,
  temperature: 0.7,
  responseFormat: "json"
});
```

## Error Handling

The `LLMError` class provides structured error information:

```typescript
interface LLMError {
  code: "authentication" | "rate_limit" | "server_error" | "parse_error" | "timeout";
  message: string;
  retryable: boolean;
  provider: string;
}
```

## Configuration

Settings are stored in the `LLMSettings` database table:
- `provider`: Provider type
- `apiEndpoint`: Base URL
- `apiKeyEncrypted`: Encrypted API key
- `model`: Model name (for Azure AI Foundry)
