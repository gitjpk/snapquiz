import { NextRequest } from "next/server";
import { joinSession } from "@/lib/sessions/sessionService";
import {
  jsonResponse,
  notFound,
  badRequest,
  sessionEnded,
  parseJsonBody,
} from "@/lib/api/http";
import { JoinSessionRequestSchema } from "@/lib/validation/schemas";
import prisma from "@/lib/db/client";

interface JoinSessionResponse {
  participantId: string;
  nickname: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<Response> {
  const { sessionId } = await params;

  // Parse and validate request body
  const parsed = await parseJsonBody(request, JoinSessionRequestSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { nickname } = parsed.data;

  // Check session exists
  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  });

  if (!session) {
    return notFound("Session");
  }

  if (session.status === "ended") {
    return sessionEnded();
  }

  try {
    const result = await joinSession(sessionId, nickname);

    const response: JoinSessionResponse = {
      participantId: result.participantId,
      nickname: result.nickname,
    };

    return jsonResponse(response);
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message);
    }
    throw error;
  }
}
