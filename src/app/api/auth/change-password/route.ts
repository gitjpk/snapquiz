import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { jsonResponse, badRequest } from "@/lib/api/http";
import { changePasswordRequestSchema, formatZodError } from "@/lib/validation/authSchemas";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireAuth } from "@/lib/auth/middleware";

/**
 * POST /api/auth/change-password
 * Change the host password (requires authentication)
 * Reference: specs/002-host-password-protection/contracts/openapi.yaml
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = changePasswordRequestSchema.safeParse(body);
  if (!parsed.success) {
    const formatted = formatZodError(parsed.error);
    return badRequest(formatted.message);
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    // Get current credential
    const credential = await prisma.hostCredential.findFirst();
    if (!credential) {
      return badRequest("No password configured");
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, credential.passwordHash);
    if (!isValid) {
      return badRequest("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update credential
    await prisma.hostCredential.update({
      where: { id: credential.id },
      data: { passwordHash: newPasswordHash },
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return badRequest("Failed to change password");
  }
}
