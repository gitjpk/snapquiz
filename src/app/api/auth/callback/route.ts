import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { exchangeCodeForTokens, isMsalConfigured } from "@/lib/auth/msal";
import {
  createSessionToken,
  createSessionRecord,
  getSessionCookieConfig,
} from "@/lib/auth/session";

/**
 * GET /api/auth/callback
 * Handles OAuth callback from Microsoft Entra ID
 * Reference: specs/005-multi-host-accounts/contracts/openapi.yaml
 * 
 * Creates or updates Host record, issues session token
 */
export async function GET(request: NextRequest) {
  // Get base URL for redirects (must use public URL, not internal container URL)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Check for OAuth errors
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      
      // Handle user cancellation
      if (error === "access_denied") {
        return NextResponse.redirect(new URL("/login?error=cancelled", baseUrl));
      }
      
      // Handle other errors
      return NextResponse.redirect(new URL("/login?error=auth_failed", baseUrl));
    }

    // Get authorization code
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", baseUrl));
    }

    // Verify state (CSRF protection)
    const state = searchParams.get("state");
    const cookieStore = await cookies();
    const storedState = cookieStore.get("oauth_state")?.value;
    
    if (!state || !storedState || state !== storedState) {
      console.error("State mismatch:", { state, storedState });
      return NextResponse.redirect(new URL("/login?error=invalid_state", baseUrl));
    }

    // Parse state to get returnTo URL
    let returnTo = "/host/quizzes";
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64url").toString());
      if (stateData.returnTo) {
        returnTo = stateData.returnTo;
      }
    } catch {
      // Use default returnTo if state parsing fails
    }

    // Clear oauth_state cookie
    cookieStore.delete("oauth_state");

    // Check if MSAL is configured
    if (!isMsalConfigured()) {
      return NextResponse.redirect(new URL("/login?error=not_configured", baseUrl));
    }

    // Build redirect URI (must match login route)
    const redirectUri = `${baseUrl}/api/auth/callback`;

    // Exchange code for tokens and get user info
    const userInfo = await exchangeCodeForTokens(code, redirectUri);

    // Upsert Host (create if new, update lastLoginAt if existing)
    const host = await prisma.host.upsert({
      where: { microsoftId: userInfo.microsoftId },
      update: {
        email: userInfo.email,
        displayName: userInfo.displayName,
        lastLoginAt: new Date(),
      },
      create: {
        microsoftId: userInfo.microsoftId,
        email: userInfo.email,
        displayName: userInfo.displayName,
      },
    });

    // Create session token with hostId
    const tokenId = crypto.randomUUID();
    const { token, expiresAt } = await createSessionToken(tokenId, host.id);

    // Create session record
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    await createSessionRecord(tokenId, host.id, expiresAt, ipAddress, userAgent);

    // Set session cookie and redirect
    const cookieConfig = getSessionCookieConfig(expiresAt);
    const response = NextResponse.redirect(new URL(returnTo, baseUrl));

    response.cookies.set(cookieConfig.name, token, {
      httpOnly: cookieConfig.httpOnly,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: cookieConfig.path,
      expires: cookieConfig.expires,
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    
    // Per FR-012: Show clear error message if Microsoft Entra ID is unavailable
    return NextResponse.redirect(new URL("/login?error=unavailable", baseUrl));
  }
}
