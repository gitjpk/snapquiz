import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { hashPassword, generateJwtSecret } from "@/lib/auth/password";
import {
  createSessionToken,
  createSessionRecord,
  getSessionCookieConfig,
} from "@/lib/auth/session";
import {
  setupRequestSchema,
  formatZodError,
} from "@/lib/validation/authSchemas";

/**
 * POST /api/auth/setup
 * Create initial host password (first-run only)
 * Returns 409 Conflict if password already exists
 */
export async function POST(request: Request) {
  try {
    // Check if password already exists
    const existingCredential = await prisma.hostCredential.findFirst();
    if (existingCredential) {
      return NextResponse.json(
        {
          error: "ALREADY_SETUP",
          message: "Host password has already been configured",
        },
        { status: 409 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = setupRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }

    const { password } = validation.data;

    // Hash password and generate JWT secret
    const passwordHash = await hashPassword(password);
    const jwtSecret = generateJwtSecret();

    // Create credential record
    await prisma.hostCredential.create({
      data: {
        passwordHash,
        jwtSecret,
      },
    });

    // Create session token for immediate login
    const tokenId = crypto.randomUUID();
    const { token, expiresAt } = await createSessionToken(jwtSecret, tokenId);

    // Create session record
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    await createSessionRecord(tokenId, expiresAt, ipAddress, userAgent);

    // Set session cookie
    const cookieConfig = getSessionCookieConfig(expiresAt);
    const response = NextResponse.json(
      {
        success: true,
        expiresAt: expiresAt.toISOString(),
      },
      { status: 201 }
    );

    response.cookies.set(cookieConfig.name, token, {
      httpOnly: cookieConfig.httpOnly,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: cookieConfig.path,
      expires: cookieConfig.expires,
    });

    return response;
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
