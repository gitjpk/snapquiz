import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import {
  validateSessionToken,
  revokeSession,
  parseSessionCookie,
  getSessionCookieName,
} from "@/lib/auth/session";

/**
 * POST /api/auth/logout
 * Revoke current session and clear cookie
 */
export async function POST(request: Request) {
  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get("cookie");
    const token = parseSessionCookie(cookieHeader);

    if (token) {
      // Get JWT secret to validate token
      const credential = await prisma.hostCredential.findFirst();
      if (credential) {
        const payload = await validateSessionToken(token, credential.jwtSecret);
        if (payload?.jti) {
          // Revoke the session
          await revokeSession(payload.jti);
        }
      }
    }

    // Clear the session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set(getSessionCookieName(), "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0), // Expire immediately
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    // Even on error, clear the cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set(getSessionCookieName(), "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });
    return response;
  }
}
