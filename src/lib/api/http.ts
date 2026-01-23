import { NextResponse } from "next/server";
import { ZodError } from "zod";

// ============================================
// Error codes matching OpenAPI spec
// ============================================

export const ErrorCode = {
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SESSION_ENDED: "SESSION_ENDED",
  QUESTION_CLOSED: "QUESTION_CLOSED",
  ALREADY_ANSWERED: "ALREADY_ANSWERED",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ============================================
// Error response type
// ============================================

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

// ============================================
// Response helpers
// ============================================

export function jsonResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiError> {
  const body: ApiError = { code, message };
  if (details) body.details = details;
  return NextResponse.json(body, { status });
}

// ============================================
// Common error responses
// ============================================

export function badRequest(
  message = "Bad request",
  details?: unknown
): NextResponse<ApiError> {
  return errorResponse(ErrorCode.BAD_REQUEST, message, 400, details);
}

export function validationError(error: ZodError): NextResponse<ApiError> {
  const issues = error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  return errorResponse(
    ErrorCode.VALIDATION_ERROR,
    "Validation failed",
    400,
    issues
  );
}

export function notFound(
  resource = "Resource"
): NextResponse<ApiError> {
  return errorResponse(ErrorCode.NOT_FOUND, `${resource} not found`, 404);
}

export function unauthorized(
  message = "Unauthorized"
): NextResponse<ApiError> {
  return errorResponse(ErrorCode.UNAUTHORIZED, message, 401);
}

export function forbidden(
  message = "Forbidden"
): NextResponse<ApiError> {
  return errorResponse(ErrorCode.FORBIDDEN, message, 403);
}

export function conflict(
  message: string
): NextResponse<ApiError> {
  return errorResponse(ErrorCode.CONFLICT, message, 409);
}

export function internalError(
  message = "Internal server error"
): NextResponse<ApiError> {
  return errorResponse(ErrorCode.INTERNAL_ERROR, message, 500);
}

// ============================================
// Session-specific error responses
// ============================================

export function sessionEnded(): NextResponse<ApiError> {
  return errorResponse(
    ErrorCode.SESSION_ENDED,
    "This session has already ended",
    400
  );
}

export function questionClosed(): NextResponse<ApiError> {
  return errorResponse(
    ErrorCode.QUESTION_CLOSED,
    "This question is no longer accepting answers",
    400
  );
}

export function alreadyAnswered(): NextResponse<ApiError> {
  return errorResponse(
    ErrorCode.ALREADY_ANSWERED,
    "You have already answered this question",
    409
  );
}

// ============================================
// Request parsing helper
// ============================================

export async function parseJsonBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<{ data: T } | { error: NextResponse<ApiError> }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: validationError(error) };
    }
    if (error instanceof SyntaxError) {
      return { error: badRequest("Invalid JSON body") };
    }
    throw error;
  }
}
