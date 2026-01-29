import bcrypt from "bcrypt";

/**
 * Password hashing utilities using bcrypt
 * Reference: specs/002-host-password-protection/research.md
 *
 * Security:
 * - Cost factor 12 provides ~250ms hash time
 * - Built-in salt generation prevents rainbow table attacks
 * - Passwords are never logged or exposed
 */

// Cost factor 12 balances security and performance (SC-004)
const BCRYPT_COST_FACTOR = 12;

/**
 * Hash a plaintext password using bcrypt
 * @param password - Plaintext password (min 8 characters per FR-008)
 * @returns Promise resolving to bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  // bcrypt handles salt generation internally
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

/**
 * Verify a plaintext password against a bcrypt hash
 * @param password - Plaintext password to verify
 * @param hash - Stored bcrypt hash
 * @returns Promise resolving to true if match, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random secret for JWT signing (256 bits)
 * @returns Base64-encoded random secret
 */
export function generateJwtSecret(): string {
  // Use crypto.randomBytes for secure random generation
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cryptoModule = require("crypto");
  return cryptoModule.randomBytes(32).toString("base64");
}
