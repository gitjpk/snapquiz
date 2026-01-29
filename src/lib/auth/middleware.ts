import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { validateSessionToken } from "@/lib/auth/session";
import { unauthorized } from "@/lib/api/http";

/**
 * Authentication result for protected routes
 */
export interface AuthResult {
  authenticated: true;
  sessionId: string;
}

/**
 * Validates authentication for API routes.
 * Returns AuthResult if authenticated, or NextResponse with error if not.
 * 
 * Usage in route handlers:
 * ```
 * const auth = await requireAuth();
 * if (auth instanceof NextResponse) return auth;
 * // auth is now AuthResult with sessionId
 * ```
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  try {
    // Check if host credentials exist (system must be set up)
    const credential = await prisma.hostCredential.findFirst();
    
    if (!credential) {
      return unauthorized("Authentication not configured. Please complete setup first.");
    }

    // Get session cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("host_session")?.value;

    if (!token) {
      return unauthorized("Authentication required");
    }

    // Validate the session token
    const payload = await validateSessionToken(token, credential.jwtSecret);

    if (!payload) {
      return unauthorized("Invalid or expired session");
    }

    // Check if session is in database and not revoked
    const session = await prisma.hostSession.findUnique({
      where: { tokenId: payload.jti as string },
    });

    if (!session) {
      return unauthorized("Session not found");
    }

    if (session.revokedAt) {
      return unauthorized("Session has been revoked");
    }

    if (session.expiresAt < new Date()) {
      return unauthorized("Session has expired");
    }

    return {
      authenticated: true,
      sessionId: session.tokenId,
    };
  } catch (err) {
    console.error("Auth error:", err);
    return unauthorized("Authentication failed");
  }
}

/**
 * Higher-order function to wrap route handlers with authentication
 * 
 * Usage:
 * ```
 * export const POST = withAuth(async (request, auth) => {
 *   // auth contains sessionId
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, auth: AuthResult, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const auth = await requireAuth();
    
    if (auth instanceof NextResponse) {
      return auth;
    }

    return handler(request, auth, ...args);
  };
}
