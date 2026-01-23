import { NextRequest } from "next/server";
import { getSessionByPin } from "@/lib/sessions/sessionService";
import { jsonResponse, notFound, badRequest } from "@/lib/api/http";
import { isValidPinFormat } from "@/lib/sessions/pin";

interface SessionSummary {
  sessionId: string;
  status: string;
  participantCount: number;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
): Promise<Response> {
  const { pin } = await params;

  // Validate PIN format
  if (!isValidPinFormat(pin)) {
    return badRequest("Invalid PIN format. PIN must be exactly 6 digits.");
  }

  const session = await getSessionByPin(pin);

  if (!session) {
    return notFound("Session");
  }

  const response: SessionSummary = {
    sessionId: session.id,
    status: session.status,
    participantCount: session._count.participants,
  };

  return jsonResponse(response);
}
