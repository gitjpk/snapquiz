/**
 * LLM Client - Provider Factory and Encryption Utils
 * Reference: specs/004-ai-quiz-generation/research.md
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import type { LLMProvider, LLMProviderType } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { AzureFoundryProvider } from "./providers/azure-foundry";
import { LLMError } from "./errors";

// ============================================
// Encryption Configuration
// ============================================

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionSecret(): Buffer {
  const secret = process.env.LLM_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("LLM_KEY_ENCRYPTION_SECRET environment variable is not set");
  }
  // Secret should be 32 bytes (64 hex chars)
  if (secret.length !== 64) {
    throw new Error(
      "LLM_KEY_ENCRYPTION_SECRET must be 32 bytes (64 hex characters)"
    );
  }
  return Buffer.from(secret, "hex");
}

// ============================================
// API Key Encryption
// ============================================

/**
 * Encrypt an API key for storage
 * Returns base64 encoded string containing: iv + authTag + ciphertext
 */
export function encryptApiKey(plaintext: string): string {
  const key = getEncryptionSecret();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine: iv (16) + authTag (16) + encrypted
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypt an encrypted API key
 * Returns empty string if input is empty (for local proxies without API key)
 */
export function decryptApiKey(encrypted: string): string {
  // Handle empty API key (for local proxies)
  if (!encrypted) {
    return "";
  }

  const key = getEncryptionSecret();
  const combined = Buffer.from(encrypted, "base64");

  // Extract: iv (16) + authTag (16) + encrypted
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

// ============================================
// Provider Factory
// ============================================

/**
 * Create an LLM provider instance based on type
 */
export function createProvider(
  provider: LLMProviderType,
  endpoint: string,
  apiKey: string,
  model?: string
): LLMProvider {
  switch (provider) {
    case "openai":
      return new OpenAIProvider(endpoint, apiKey);
    case "anthropic":
      return new AnthropicProvider(endpoint, apiKey);
    case "azure-foundry":
      return new AzureFoundryProvider(endpoint, apiKey, model || "Mistral-Large-3");
    default:
      throw new LLMError({
        code: "invalid_request",
        message: `Unknown provider: ${provider}`,
        retryable: false,
      });
  }
}

/**
 * Create an LLM provider from encrypted settings
 */
export function createProviderFromSettings(settings: {
  provider: LLMProviderType;
  apiEndpoint: string;
  apiKey: string; // encrypted
  model?: string;
}): LLMProvider {
  const decryptedKey = decryptApiKey(settings.apiKey);
  return createProvider(settings.provider, settings.apiEndpoint, decryptedKey, settings.model);
}

// ============================================
// Default Endpoints
// ============================================

export const DEFAULT_ENDPOINTS: Record<LLMProviderType, string> = {
  openai: "https://api.openai.com",
  anthropic: "https://api.anthropic.com",
  "azure-foundry": "https://snapquiz-resource.services.ai.azure.com/openai/v1",
};
