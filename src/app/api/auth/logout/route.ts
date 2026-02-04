import { NextResponse } from "next/server";
import {
  validateSessionToken,
  revokeSession,
  parseSessionCookie,
  getSessionCookieName,
} from "@/lib/auth/session";

/**
 * POST /api/auth/logout
 * Revoke current session and clear cookie
 * Reference: specs/005-multi-host-accounts/contracts/openapi.yaml
 */
export async function POST(request: Request) {
  try {
    // Get session token from cookie
    const cookieHeader = request.headers.get("cookie");
    const token = parseSessionCookie(cookieHeader);

    if (token) {
      const payload = await validateSessionToken(token);
      if (payload?.jti) {
        // Revoke the session
        await revokeSession(payload.jti);
      }
    }

    // Clear the session cookie
    const isHttps = process.env.NODE_ENV === "production" || 
      process.env.USE_HTTPS_COOKIES === "true";
    
    const response = NextResponse.json({ success: true });
    response.cookies.set(getSessionCookieName(), "", {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? "none" : "lax",
      path: "/",
      expires: new Date(0), // Expire immediately
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    // Even on error, clear the cookie
    const isHttps = process.env.NODE_ENV === "production" || 
      process.env.USE_HTTPS_COOKIES === "true";
    
    const response = NextResponse.json({ success: true });
    response.cookies.set(getSessionCookieName(), "", {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? "none" : "lax",
      path: "/",
      expires: new Date(0),
    });
    return response;
  }
}
