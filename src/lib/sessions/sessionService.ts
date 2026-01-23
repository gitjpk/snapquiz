import prisma from "@/lib/db/client";
import { generateUniquePin } from "./pin";
import {
  createLobbyUpdatedEvent,
  createQuestionStartedEvent,
  createQuestionClosedEvent,
  createAnswerRevealEvent,
  createLeaderboardUpdatedEvent,
  createGameEndedEvent,
  type RealtimeQuestion,
  type RealtimeEvent,
} from "@/lib/realtime/events";
import { calculatePointsFromTimestamps } from "@/lib/scoring/scoring";

/**
 * Global Socket.IO emitter shared across Webpack bundles.
 * This is necessary because Next.js compiles server and client code separately.
 */
declare global {
  // eslint-disable-next-line no-var
  var __socketEmitter: ((sessionId: string, event: RealtimeEvent) => void) | undefined;
}

/**
 * Register the Socket.IO emitter function from the custom server.
 * Must be called during server initialization.
 * @param fn - Function to emit events to a session room
 */
export function setEmitter(
  fn: (sessionId: string, event: RealtimeEvent) => void
): void {
  globalThis.__socketEmitter = fn;
}

/**
 * Emit a realtime event to all clients in a session.
 * @param sessionId - The session to emit to
 * @param event - The event payload
 */
function emit(sessionId: string, event: RealtimeEvent): void {
  if (globalThis.__socketEmitter) {
    globalThis.__socketEmitter(sessionId, event);
  }
}

// ============================================
// Session Lifecycle
// ============================================

export interface CreateSessionResult {
  sessionId: string;
  pin: string;
}

/**
 * Create a new live session for a quiz.
 * Generates a unique 6-digit PIN for players to join.
 * @param quizId - The quiz to create a session for
 * @param leaderboardTopN - Number of top players to show on leaderboard
 * @returns The session ID and PIN
 * @throws Error if quiz not found
 */
export async function createSession(
  quizId: string,
  leaderboardTopN = 5
): Promise<CreateSessionResult> {
  // Verify quiz exists
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true },
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  const pin = await generateUniquePin();

  const session = await prisma.liveSession.create({
    data: {
      quizId,
      pin,
      status: "lobby",
      leaderboardTopN,
    },
  });

  return {
    sessionId: session.id,
    pin: session.pin,
  };
}

export async function getSessionByPin(pin: string) {
  return prisma.liveSession.findFirst({
    where: {
      pin,
      status: { in: ["lobby", "in_progress"] },
    },
    include: {
      _count: {
        select: { participants: { where: { status: "active" } } },
      },
    },
  });
}

export async function getSessionById(sessionId: string) {
  return prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
            include: {
              answerOptions: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      },
      _count: {
        select: { participants: { where: { status: "active" } } },
      },
    },
  });
}

// ============================================
// Participant Management
// ============================================

export interface JoinSessionResult {
  participantId: string;
  nickname: string;
}

/**
 * Add a participant to a live session.
 * Creates a score record and broadcasts the updated participant list.
 * @param sessionId - The session to join
 * @param nickname - The player's display name
 * @returns The participant ID and nickname
 * @throws Error if session not found or ended
 */
export async function joinSession(
  sessionId: string,
  nickname: string
): Promise<JoinSessionResult> {
  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.status === "ended") {
    throw new Error("Session has ended");
  }

  // Create participant
  const participant = await prisma.participant.create({
    data: {
      sessionId,
      nickname,
      status: "active",
    },
  });

  // Create initial score record
  await prisma.score.create({
    data: {
      sessionId,
      participantId: participant.id,
      pointsTotal: 0,
    },
  });

  // Broadcast updated participant list
  const participants = await prisma.participant.findMany({
    where: { sessionId, status: "active" },
    select: { id: true, nickname: true },
  });
  emit(sessionId, createLobbyUpdatedEvent(participants.length, participants));

  return {
    participantId: participant.id,
    nickname: participant.nickname,
  };
}

// ============================================
// Game Flow Control
// ============================================

/**
 * Start the quiz game for a session.
 * Transitions from lobby to in_progress and broadcasts the first question.
 * @param sessionId - The session to start
 * @throws Error if session not found, already started, or has no questions
 */
export async function startGame(sessionId: string): Promise<void> {
  const session = await getSessionById(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.status !== "lobby") {
    throw new Error("Game has already started");
  }

  if (session.quiz.questions.length === 0) {
    throw new Error("Quiz has no questions");
  }

  // Update session status
  await prisma.liveSession.update({
    where: { id: sessionId },
    data: {
      status: "in_progress",
      startedAt: new Date(),
      currentQuestionIndex: 0,
      questionStartedAt: new Date(),
    },
  });

  // Broadcast first question
  const firstQuestion = session.quiz.questions[0];
  const realtimeQuestion: RealtimeQuestion = {
    id: firstQuestion.id,
    prompt: firstQuestion.prompt,
    timeLimitSeconds: firstQuestion.timeLimitSeconds,
    mediaUrl: firstQuestion.mediaUrl,
    mediaType: firstQuestion.mediaType as "image" | "video" | null,
    options: firstQuestion.answerOptions.map((opt) => ({
      id: opt.id,
      label: opt.label,
    })),
  };

  emit(
    sessionId,
    createQuestionStartedEvent(realtimeQuestion, 0, session.quiz.questions.length)
  );
}

/**
 * Advance to the next question in the quiz.
 * @param sessionId - The session to advance
 * @returns true if advanced to next question, false if no more questions
 * @throws Error if session not in progress
 */
export async function nextQuestion(sessionId: string): Promise<boolean> {
  const session = await getSessionById(sessionId);

  if (!session || session.status !== "in_progress") {
    throw new Error("Session not in progress");
  }

  const currentIndex = session.currentQuestionIndex ?? 0;
  const nextIndex = currentIndex + 1;

  if (nextIndex >= session.quiz.questions.length) {
    return false; // No more questions
  }

  await prisma.liveSession.update({
    where: { id: sessionId },
    data: { 
      currentQuestionIndex: nextIndex,
      questionStartedAt: new Date(),
    },
  });

  const nextQ = session.quiz.questions[nextIndex];
  const realtimeQuestion: RealtimeQuestion = {
    id: nextQ.id,
    prompt: nextQ.prompt,
    timeLimitSeconds: nextQ.timeLimitSeconds,
    mediaUrl: nextQ.mediaUrl,
    mediaType: nextQ.mediaType as "image" | "video" | null,
    options: nextQ.answerOptions.map((opt) => ({
      id: opt.id,
      label: opt.label,
    })),
  };

  emit(
    sessionId,
    createQuestionStartedEvent(
      realtimeQuestion,
      nextIndex,
      session.quiz.questions.length
    )
  );

  return true;
}

/**
 * Close the current question to prevent further answers.
 * @param sessionId - The session to close question for
 * @throws Error if session not in progress
 */
export async function closeQuestion(sessionId: string): Promise<void> {
  const session = await getSessionById(sessionId);

  if (!session || session.status !== "in_progress") {
    throw new Error("Session not in progress");
  }

  const currentIndex = session.currentQuestionIndex ?? 0;
  const question = session.quiz.questions[currentIndex];

  emit(sessionId, createQuestionClosedEvent(question.id));
}

/**
 * Reveal the correct answer and show response distribution.
 * @param sessionId - The session to reveal answer for
 * @throws Error if session not in progress or no correct answer defined
 */
export async function revealAnswer(sessionId: string): Promise<void> {
  const session = await getSessionById(sessionId);

  if (!session || session.status !== "in_progress") {
    throw new Error("Session not in progress");
  }

  const currentIndex = session.currentQuestionIndex ?? 0;
  const question = session.quiz.questions[currentIndex];
  const correctOption = question.answerOptions.find((opt) => opt.isCorrect);

  if (!correctOption) {
    throw new Error("No correct answer defined for question");
  }

  // Calculate distribution
  const responses = await prisma.response.groupBy({
    by: ["selectedOptionId"],
    where: {
      sessionId,
      questionId: question.id,
    },
    _count: true,
  });

  const distribution = question.answerOptions.map((opt) => ({
    optionId: opt.id,
    count: responses.find((r) => r.selectedOptionId === opt.id)?._count ?? 0,
  }));

  emit(
    sessionId,
    createAnswerRevealEvent(question.id, correctOption.id, distribution)
  );
}

/**
 * Broadcast the current leaderboard to all participants.
 * @param sessionId - The session to show leaderboard for
 * @throws Error if session not found
 */
export async function showLeaderboard(sessionId: string): Promise<void> {
  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    select: { id: true, leaderboardTopN: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  const scores = await prisma.score.findMany({
    where: { sessionId },
    orderBy: { pointsTotal: "desc" },
    take: session.leaderboardTopN,
    include: {
      participant: {
        select: { nickname: true },
      },
    },
  });

  const entries = scores.map((score, index) => ({
    participantId: score.participantId,
    nickname: score.participant.nickname,
    pointsTotal: score.pointsTotal,
    rank: index + 1,
  }));

  emit(sessionId, createLeaderboardUpdatedEvent(entries));
}

/**
 * End the game and broadcast final results.
 * Sets session status to ended and shows the final podium.
 * @param sessionId - The session to end
 * @throws Error if session not found
 */
export async function endGame(sessionId: string): Promise<void> {
  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    select: { id: true, leaderboardTopN: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  // Update session status
  await prisma.liveSession.update({
    where: { id: sessionId },
    data: {
      status: "ended",
      endedAt: new Date(),
    },
  });

  // Get final podium
  const scores = await prisma.score.findMany({
    where: { sessionId },
    orderBy: { pointsTotal: "desc" },
    take: Math.min(session.leaderboardTopN, 5),
    include: {
      participant: {
        select: { nickname: true },
      },
    },
  });

  const podium = scores.map((score, index) => ({
    participantId: score.participantId,
    nickname: score.participant.nickname,
    pointsTotal: score.pointsTotal,
    rank: index + 1,
  }));

  emit(sessionId, createGameEndedEvent(podium));
}

// ============================================
// Answer Submission
// ============================================

export interface SubmitAnswerResult {
  accepted: boolean;
  isCorrect?: boolean;
  points?: number;
}

/**
 * Submit an answer for the current question.
 * Validates the submission, calculates points, and updates the score.
 * @param sessionId - The session ID
 * @param participantId - The participant submitting
 * @param questionId - The question being answered
 * @param selectedOptionId - The chosen answer option
 * @returns Result with acceptance status, correctness, and points awarded
 * @throws Error if session/question invalid or already answered
 */
export async function submitAnswer(
  sessionId: string,
  participantId: string,
  questionId: string,
  selectedOptionId: string
): Promise<SubmitAnswerResult> {
  const now = new Date();
  
  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true, currentQuestionIndex: true, questionStartedAt: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.status !== "in_progress") {
    throw new Error("Session not in progress");
  }

  // Verify the question is the current one
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      quiz: {
        include: {
          liveSessions: {
            where: { id: sessionId },
            select: { currentQuestionIndex: true },
          },
        },
      },
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  // Verify selected option exists and belongs to this question
  const selectedOption = await prisma.answerOption.findFirst({
    where: {
      id: selectedOptionId,
      questionId,
    },
  });

  if (!selectedOption) {
    throw new Error("Invalid option selected");
  }

  // Check if already answered
  const existing = await prisma.response.findUnique({
    where: {
      participantId_questionId: {
        participantId,
        questionId,
      },
    },
  });

  if (existing) {
    throw new Error("Already answered");
  }

  const isCorrect = selectedOption.isCorrect;

  // Get the question's time limit for scoring
  const questionWithTimeLimit = await prisma.question.findUnique({
    where: { id: questionId },
    select: { timeLimitSeconds: true },
  });

  // Calculate points using the scoring algorithm
  const timeLimitMs = (questionWithTimeLimit?.timeLimitSeconds ?? 30) * 1000;
  const questionStartedAt = session.questionStartedAt ?? now;
  
  const pointsAwarded = calculatePointsFromTimestamps(
    isCorrect,
    questionStartedAt,
    now,
    timeLimitMs
  );

  // Create response with respondedAt timestamp
  await prisma.response.create({
    data: {
      sessionId,
      participantId,
      questionId,
      selectedOptionId,
      isCorrect,
      pointsAwarded,
      respondedAt: now,
    },
  });

  // Update score
  if (pointsAwarded > 0) {
    await prisma.score.update({
      where: { participantId },
      data: {
        pointsTotal: {
          increment: pointsAwarded,
        },
      },
    });
  }

  return {
    accepted: true,
    isCorrect,
    points: pointsAwarded,
  };
}
