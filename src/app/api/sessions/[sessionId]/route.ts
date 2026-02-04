import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/client";
import { jsonResponse, notFound } from "@/lib/api/http";
import { requireAuth, verifyOwnership, forbiddenResponse } from "@/lib/auth/middleware";

interface SessionDetailResponse {
  id: string;
  pin: string;
  status: string;
  participantCount: number;
  quiz: {
    id: string;
    title: string;
    description: string | null;
    questionCount: number;
  };
  createdAt: string;
}

/**
 * GET /api/sessions/[sessionId]
 * Get session details by ID (requires authentication)
 * Session's quiz must be owned by the authenticated host
 * Reference: specs/005-multi-host-accounts/spec.md - FR-007 ownership check
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<Response> {
  // Require authentication
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { sessionId } = await params;

  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          description: true,
          ownerHostId: true,
          _count: {
            select: { questions: true },
          },
        },
      },
      _count: {
        select: { participants: true },
      },
    },
  });

  if (!session) {
    return notFound("Session");
  }

  // Verify ownership via quiz (FR-007: return 403 for unauthorized access)
  if (!await verifyOwnership(auth, session.quiz.ownerHostId)) {
    return forbiddenResponse();
  }

  const response: SessionDetailResponse = {
    id: session.id,
    pin: session.pin,
    status: session.status,
    participantCount: session._count.participants,
    quiz: {
      id: session.quiz.id,
      title: session.quiz.title,
      description: session.quiz.description,
      questionCount: session.quiz._count.questions,
    },
    createdAt: session.createdAt.toISOString(),
  };

  return jsonResponse(response);
}
