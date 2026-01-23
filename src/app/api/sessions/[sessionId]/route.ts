import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { jsonResponse, notFound } from "@/lib/api/http";

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
 * Get session details by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<Response> {
  const { sessionId } = await params;

  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          description: true,
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
