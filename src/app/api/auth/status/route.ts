import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import {
  validateSessionToken,
  parseSessionCookie,
} from "@/lib/auth/session";
import { isMsalConfigured } from "@/lib/auth/msal";

/**
 * GET /api/auth/status
 * Check authentication status and return host info
 * Reference: specs/005-multi-host-accounts/contracts/openapi.yaml
 */
export async function GET(request: Request) {
  try {
    // Check if Microsoft OAuth is configured
    const isConfigured = isMsalConfigured();

    // Check if user is authenticated
    let isAuthenticated = false;
    let host: { id: string; email: string; displayName: string | null; lastLoginAt: string | null } | null = null;

    const cookieHeader = request.headers.get("cookie");
    const token = parseSessionCookie(cookieHeader);

    if (token) {
      const payload = await validateSessionToken(token);
      
      if (payload && payload.jti) {
        // Get session with host info
        const session = await prisma.hostSession.findUnique({
          where: { tokenId: payload.jti },
          include: { host: true },
        });

        if (session && !session.revokedAt && session.expiresAt > new Date()) {
          isAuthenticated = true;
          host = {
            id: session.host.id,
            email: session.host.email,
            displayName: session.host.displayName,
            lastLoginAt: session.host.lastLoginAt?.toISOString() || null,
          };
        }
      }
    }

    return NextResponse.json({
      isConfigured,
      isAuthenticated,
      host,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
