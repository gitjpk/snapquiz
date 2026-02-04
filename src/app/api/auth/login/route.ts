import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthorizationUrl, generateState, isMsalConfigured } from "@/lib/auth/msal";

/**
 * GET /api/auth/login
 * Initiates Microsoft OAuth login flow
 * Reference: specs/005-multi-host-accounts/contracts/openapi.yaml
 * 
 * Query params:
 * - returnTo: URL to redirect to after login (default: /host/quizzes)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if MSAL is configured
    if (!isMsalConfigured()) {
      return NextResponse.json(
        {
          error: "NOT_CONFIGURED",
          message: "Microsoft Entra ID is not configured. Please set AZURE_AD_CLIENT_ID and AZURE_AD_CLIENT_SECRET.",
        },
        { status: 500 }
      );
    }

    // Get return URL from query params
    const searchParams = request.nextUrl.searchParams;
    const returnTo = searchParams.get("returnTo") || "/host/quizzes";

    // Generate state for CSRF protection (includes returnTo URL)
    const state = generateState();
    const stateData = JSON.stringify({ state, returnTo });
    const encodedState = Buffer.from(stateData).toString("base64url");

    // Store state in cookie for verification in callback
    const cookieStore = await cookies();
    cookieStore.set("oauth_state", encodedState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || process.env.USE_HTTPS_COOKIES === "true",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Build redirect URI
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const redirectUri = `${baseUrl}/api/auth/callback`;

    // Get Microsoft authorization URL
    const authUrl = await getAuthorizationUrl(redirectUri, encodedState);

    // Redirect to Microsoft login
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: "LOGIN_ERROR",
        message: "Failed to initiate login. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * Legacy POST endpoint for backwards compatibility during transition
 * Returns error directing users to use Microsoft login
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "METHOD_CHANGED",
      message: "Password authentication has been replaced. Please use 'Sign in with Microsoft' button.",
    },
    { status: 400 }
  );
}
