import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { prisma } from "@/lib/db/client";

/**
 * JWT session management using jose
 * Reference: specs/005-multi-host-accounts/research.md
 *
 * Security:
 * - HTTP-only cookies prevent XSS token theft
 * - 7-day expiration per clarification
 * - Token revocation checked against HostSession table
 * - JWT contains hostId for data isolation
 */

// Session configuration
const SESSION_TTL_DAYS = 7;
const COOKIE_NAME = "host_session";

// JWT secret - use environment variable or generate a default for development
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.LLM_KEY_ENCRYPTION_SECRET || "development-jwt-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload extends JWTPayload {
  jti: string;   // Token ID for revocation
  hostId: string; // Host ID for data isolation
  iat: number;   // Issued at
  exp: number;   // Expiration
}

/**
 * Create a new JWT session token
 * @param tokenId - Unique token ID (stored in HostSession)
 * @param hostId - Host ID for data isolation
 * @returns Signed JWT string and expiration date
 */
export async function createSessionToken(
  tokenId: string,
  hostId: string
): Promise<{ token: string; expiresAt: Date }> {
  const secret = getJwtSecret();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const token = await new SignJWT({ jti: tokenId, hostId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);

  return { token, expiresAt };
}

/**
 * Validate a JWT session token
 * @param token - JWT string from cookie
 * @returns Decoded payload if valid, null if invalid/expired/revoked
 */
export async function validateSessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    // Check if token has been revoked
    if (payload.jti) {
      const session = await prisma.hostSession.findUnique({
        where: { tokenId: payload.jti as string },
      });

      // Session doesn't exist or was revoked
      if (!session || session.revokedAt) {
        return null;
      }

      // Check if expired (belt and suspenders with JWT exp)
      if (session.expiresAt < new Date()) {
        return null;
      }
    }

    return payload as SessionPayload;
  } catch {
    // Invalid token, expired, or verification failed
    return null;
  }
}

/**
 * Revoke a session (logout)
 * @param tokenId - JWT jti claim
 */
export async function revokeSession(tokenId: string): Promise<void> {
  await prisma.hostSession.update({
    where: { tokenId },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke all sessions for a host (logout from all devices)
 * @param hostId - Host ID
 */
export async function revokeAllSessions(hostId: string): Promise<void> {
  await prisma.hostSession.updateMany({
    where: { 
      hostId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

/**
 * Create a session record in the database
 * @param tokenId - Unique token ID (JWT jti)
 * @param hostId - Host ID
 * @param expiresAt - When the session expires
 * @param ipAddress - Client IP (optional)
 * @param userAgent - Browser user agent (optional)
 */
export async function createSessionRecord(
  tokenId: string,
  hostId: string,
  expiresAt: Date,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await prisma.hostSession.create({
    data: {
      tokenId,
      hostId,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Get session cookie configuration
 */
export function getSessionCookieConfig(expiresAt: Date) {
  // For ngrok (HTTPS tunnel), we need secure=true with sameSite=none
  // For localhost dev, secure=false with sameSite=lax
  const isHttps = process.env.NODE_ENV === "production" || 
    process.env.USE_HTTPS_COOKIES === "true";
  
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" as const : "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/**
 * Get cookie name for session
 */
export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

/**
 * Parse session token from cookie header
 */
export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (!sessionCookie) return null;

  return sessionCookie.substring(COOKIE_NAME.length + 1);
}
