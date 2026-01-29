/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateJwtSecret,
} from "@/lib/auth/password";

// Mock Prisma client for session validation tests
vi.mock("@/lib/db/client", () => ({
  prisma: {
    hostSession: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/client";

// Import session utilities
import {
  createSessionToken,
  validateSessionToken,
  parseSessionCookie,
  getSessionCookieName,
} from "@/lib/auth/session";

describe("Password utilities", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "securepassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      // bcrypt hashes start with $2b$ or $2a$
      expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it("should generate different hashes for same password (salt)", async () => {
      const password = "securepassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle unicode passwords", async () => {
      const password = "пароль🔐密码";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it("should handle special characters", async () => {
      const password = 'p@$$w0rd!#%&*()[]{}|;:",.<>?/\\';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[ab]\$/);
    });
  });

  describe("verifyPassword", () => {
    it("should return true for matching password", async () => {
      const password = "securepassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should return false for non-matching password", async () => {
      const password = "securepassword123";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword("wrongpassword", hash);
      expect(isValid).toBe(false);
    });

    it("should verify unicode passwords correctly", async () => {
      const password = "пароль🔐密码";
      const hash = await hashPassword(password);

      expect(await verifyPassword(password, hash)).toBe(true);
      expect(await verifyPassword("wrongpassword", hash)).toBe(false);
    });
  });

  describe("generateJwtSecret", () => {
    it("should generate a base64 string", () => {
      const secret = generateJwtSecret();

      expect(secret).toBeDefined();
      expect(typeof secret).toBe("string");
      // Base64 check: should decode without error
      expect(() => Buffer.from(secret, "base64")).not.toThrow();
    });

    it("should generate 256 bits (32 bytes)", () => {
      const secret = generateJwtSecret();
      const bytes = Buffer.from(secret, "base64");

      expect(bytes.length).toBe(32);
    });

    it("should generate unique secrets", () => {
      const secrets = new Set(Array.from({ length: 100 }, generateJwtSecret));
      expect(secrets.size).toBe(100);
    });
  });
});

describe("Session utilities", () => {
  const testSecret = generateJwtSecret();
  const testTokenId = "test-token-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSessionToken", () => {
    it("should create a valid JWT", async () => {
      const { token, expiresAt } = await createSessionToken(
        testSecret,
        testTokenId
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      // JWT has 3 parts separated by dots
      expect(token.split(".").length).toBe(3);
      expect(expiresAt).toBeInstanceOf(Date);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("should set expiration to 24 hours", async () => {
      const before = Date.now();
      const { expiresAt } = await createSessionToken(testSecret, testTokenId);
      const after = Date.now();

      const expectedMin = before + 24 * 60 * 60 * 1000;
      const expectedMax = after + 24 * 60 * 60 * 1000;

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe("validateSessionToken", () => {
    it("should validate a valid token with active session", async () => {
      const { token, expiresAt } = await createSessionToken(
        testSecret,
        testTokenId
      );

      // Mock active session
      vi.mocked(prisma.hostSession.findUnique).mockResolvedValue({
        id: "session-1",
        tokenId: testTokenId,
        createdAt: new Date(),
        expiresAt,
        revokedAt: null,
        ipAddress: null,
        userAgent: null,
      });

      const payload = await validateSessionToken(token, testSecret);

      expect(payload).not.toBeNull();
      expect(payload?.jti).toBe(testTokenId);
    });

    it("should return null for revoked session", async () => {
      const { token, expiresAt } = await createSessionToken(
        testSecret,
        testTokenId
      );

      // Mock revoked session
      vi.mocked(prisma.hostSession.findUnique).mockResolvedValue({
        id: "session-1",
        tokenId: testTokenId,
        createdAt: new Date(),
        expiresAt,
        revokedAt: new Date(), // Revoked!
        ipAddress: null,
        userAgent: null,
      });

      const payload = await validateSessionToken(token, testSecret);
      expect(payload).toBeNull();
    });

    it("should return null for non-existent session", async () => {
      const { token } = await createSessionToken(testSecret, testTokenId);

      vi.mocked(prisma.hostSession.findUnique).mockResolvedValue(null);

      const payload = await validateSessionToken(token, testSecret);
      expect(payload).toBeNull();
    });

    it("should return null for invalid token", async () => {
      const payload = await validateSessionToken("invalid.token.here", testSecret);
      expect(payload).toBeNull();
    });

    it("should return null for wrong secret", async () => {
      const { token } = await createSessionToken(testSecret, testTokenId);
      const wrongSecret = generateJwtSecret();

      const payload = await validateSessionToken(token, wrongSecret);
      expect(payload).toBeNull();
    });
  });

  describe("parseSessionCookie", () => {
    it("should parse session cookie from header", () => {
      const cookieName = getSessionCookieName();
      const token = "test-jwt-token";
      const header = `${cookieName}=${token}; other_cookie=value`;

      const result = parseSessionCookie(header);
      expect(result).toBe(token);
    });

    it("should return null for missing cookie", () => {
      const result = parseSessionCookie("other_cookie=value");
      expect(result).toBeNull();
    });

    it("should return null for null header", () => {
      const result = parseSessionCookie(null);
      expect(result).toBeNull();
    });
  });

  describe("getSessionCookieName", () => {
    it("should return host_session", () => {
      expect(getSessionCookieName()).toBe("host_session");
    });
  });
});

/**
 * Extended tests for unicode/special character passwords (T038)
 * Reference: FR-008 from specs/002-host-password-protection/spec.md
 */
describe("Unicode and special character password support", () => {
  describe("Unicode passwords", () => {
    it("should handle Cyrillic characters", async () => {
      const password = "МойСекретныйПароль"; // Russian
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
      expect(await verifyPassword("wrongpassword", hash)).toBe(false);
    });

    it("should handle Chinese characters", async () => {
      const password = "我的密码非常安全"; // Chinese
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("should handle Japanese characters", async () => {
      const password = "パスワード123"; // Japanese Katakana + numbers
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("should handle Arabic characters", async () => {
      const password = "كلمةالمرور"; // Arabic
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("should handle emoji characters", async () => {
      const password = "Password🔐🎉💪"; // With emojis
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("should handle mixed scripts", async () => {
      const password = "Pass密码пароль🔐";
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
    });
  });

  describe("Special character passwords", () => {
    it("should handle common special characters", async () => {
      const password = "P@$$w0rd!#%&*";
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("should handle quotes and brackets", async () => {
      const password = `Pass'word"test[{(<>)}]`;
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("should handle pipe and backslash", async () => {
      const password = "Pass|word\\test";
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("should handle spaces in password", async () => {
      const password = "Password With Spaces 123";
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
      // Verify trailing/leading spaces are preserved
      expect(await verifyPassword("Password With Spaces 123 ", hash)).toBe(false);
    });

    it("should handle newlines and tabs", async () => {
      const password = "Password\nWith\tWhitespace";
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("should handle null bytes (edge case)", async () => {
      const password = "Password\x00WithNull";
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
    });
  });

  describe("Long passwords", () => {
    it("should handle 72-character password (bcrypt limit)", async () => {
      // bcrypt truncates at 72 bytes
      const password = "A".repeat(72);
      const hash = await hashPassword(password);
      
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("should handle password longer than 72 characters", async () => {
      const password = "A".repeat(100);
      const hash = await hashPassword(password);
      
      // Note: bcrypt truncates at 72 bytes, so this will match
      expect(await verifyPassword(password, hash)).toBe(true);
    });
  });
});
