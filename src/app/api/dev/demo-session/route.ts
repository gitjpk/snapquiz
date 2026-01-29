import { NextRequest } from "next/server";
import prisma from "@/lib/db/client";
import { createSession } from "@/lib/sessions/sessionService";
import { jsonResponse, unauthorized, internalError } from "@/lib/api/http";

const DEMO_API_KEY = process.env.DEMO_API_KEY;

interface DemoSessionResponse {
  quizId: string;
  quizTitle: string;
  sessionId: string;
  pin: string;
  joinUrl: string;
}

/**
 * POST /api/dev/demo-session
 * Create a demo quiz and session for testing.
 * Protected by DEMO_API_KEY.
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Check API key
  const apiKey = request.headers.get("x-api-key");
  if (!DEMO_API_KEY || apiKey !== DEMO_API_KEY) {
    return unauthorized("Invalid or missing API key");
  }

  try {
    // Create a demo quiz
    const quiz = await prisma.quiz.create({
      data: {
        title: `Demo Quiz - ${new Date().toISOString()}`,
        description: "A demo quiz created for testing",
        questions: {
          create: [
            {
              orderIndex: 0,
              prompt: "What is the capital of France?",
              timeLimitSeconds: 20,
              answerOptions: {
                create: [
                  { orderIndex: 0, label: "London", isCorrect: false },
                  { orderIndex: 1, label: "Paris", isCorrect: true },
                  { orderIndex: 2, label: "Berlin", isCorrect: false },
                  { orderIndex: 3, label: "Madrid", isCorrect: false },
                ],
              },
            },
            {
              orderIndex: 1,
              prompt: "Which planet is closest to the Sun?",
              timeLimitSeconds: 15,
              answerOptions: {
                create: [
                  { orderIndex: 0, label: "Venus", isCorrect: false },
                  { orderIndex: 1, label: "Mercury", isCorrect: true },
                  { orderIndex: 2, label: "Mars", isCorrect: false },
                  { orderIndex: 3, label: "Earth", isCorrect: false },
                ],
              },
            },
            {
              orderIndex: 2,
              prompt: "What is 7 × 8?",
              timeLimitSeconds: 10,
              answerOptions: {
                create: [
                  { orderIndex: 0, label: "54", isCorrect: false },
                  { orderIndex: 1, label: "56", isCorrect: true },
                  { orderIndex: 2, label: "58", isCorrect: false },
                  { orderIndex: 3, label: "64", isCorrect: false },
                ],
              },
            },
          ],
        },
      },
    });

    // Create a session for the quiz
    const { sessionId, pin } = await createSession(quiz.id);

    // Build join URL
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const joinUrl = `${protocol}://${host}/join?pin=${pin}`;

    const response: DemoSessionResponse = {
      quizId: quiz.id,
      quizTitle: quiz.title,
      sessionId,
      pin,
      joinUrl,
    };

    return jsonResponse(response, 201);
  } catch (error) {
    console.error("Failed to create demo session:", error);
    return internalError("Failed to create demo session");
  }
}
