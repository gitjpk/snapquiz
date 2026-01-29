import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  createSessionRecord,
  getSessionCookieConfig,
} from "@/lib/auth/session";
import {
  loginRequestSchema,
  formatZodError,
} from "@/lib/validation/authSchemas";
import { loginRateLimit, getClientIp, withRateLimit } from "@/lib/api/rateLimit";

/**
 * POST /api/auth/login
 * Authenticate host with password
 * Returns 429 if rate limited (5 attempts/min/IP)
 */
export async function POST(request: Request) {
  try {
    // Apply rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = withRateLimit(request, clientIp, loginRateLimit);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "TOO_MANY_REQUESTS",
          message: "Too many login attempts. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Check if password exists
    const credential = await prisma.hostCredential.findFirst();
    if (!credential) {
      return NextResponse.json(
        {
          error: "NOT_SETUP",
          message: "Host password has not been configured. Please run setup first.",
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = loginRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }

    const { password } = validation.data;

    // Verify password
    const isValid = await verifyPassword(password, credential.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        {
          error: "INVALID_PASSWORD",
          message: "The password you entered is incorrect",
        },
        { status: 401 }
      );
    }

    // Create session token
    const tokenId = crypto.randomUUID();
    const { token, expiresAt } = await createSessionToken(
      credential.jwtSecret,
      tokenId
    );

    // Create session record
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    await createSessionRecord(tokenId, expiresAt, ipAddress, userAgent);

    // Set session cookie
    const cookieConfig = getSessionCookieConfig(expiresAt);
    const response = NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
    });

    response.cookies.set(cookieConfig.name, token, {
      httpOnly: cookieConfig.httpOnly,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: cookieConfig.path,
      expires: cookieConfig.expires,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
