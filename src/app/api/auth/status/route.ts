import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import {
  validateSessionToken,
  parseSessionCookie,
} from "@/lib/auth/session";

/**
 * GET /api/auth/status
 * Check if password is set up and if user is authenticated
 */
export async function GET(request: Request) {
  try {
    // Check if password exists
    const credential = await prisma.hostCredential.findFirst();
    const isSetup = !!credential;

    // Check if user is authenticated
    let isAuthenticated = false;

    if (credential) {
      const cookieHeader = request.headers.get("cookie");
      const token = parseSessionCookie(cookieHeader);

      if (token) {
        const payload = await validateSessionToken(token, credential.jwtSecret);
        isAuthenticated = !!payload;
      }
    }

    return NextResponse.json({
      isSetup,
      isAuthenticated,
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
