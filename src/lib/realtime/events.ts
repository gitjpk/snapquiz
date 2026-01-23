/**
 * Realtime event types for SnapQuiz live sessions.
 * Matches specs/001-live-quiz-game/contracts/asyncapi.yaml
 */

// ============================================
// Event type constants
// ============================================

export const RealtimeEventType = {
  LOBBY_UPDATED: "lobby.updated",
  QUESTION_STARTED: "question.started",
  QUESTION_CLOSED: "question.closed",
  ANSWER_REVEAL: "answer.reveal",
  LEADERBOARD_UPDATED: "leaderboard.updated",
  GAME_ENDED: "game.ended",
} as const;

export type RealtimeEventType =
  (typeof RealtimeEventType)[keyof typeof RealtimeEventType];

// ============================================
// Event payloads
// ============================================

export interface LobbyParticipant {
  id: string;
  nickname: string;
}

export interface LobbyUpdatedEvent {
  type: typeof RealtimeEventType.LOBBY_UPDATED;
  participantCount: number;
  participants: LobbyParticipant[];
}

export interface RealtimeOption {
  id: string;
  label: string;
}

export interface RealtimeQuestion {
  id: string;
  prompt: string;
  timeLimitSeconds: number;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  options: RealtimeOption[];
}

export interface QuestionStartedEvent {
  type: typeof RealtimeEventType.QUESTION_STARTED;
  question: RealtimeQuestion;
  questionIndex: number;
  totalQuestions: number;
}

export interface QuestionClosedEvent {
  type: typeof RealtimeEventType.QUESTION_CLOSED;
  questionId: string;
}

export interface AnswerDistribution {
  optionId: string;
  count: number;
}

export interface AnswerRevealEvent {
  type: typeof RealtimeEventType.ANSWER_REVEAL;
  questionId: string;
  correctOptionId: string;
  distribution: AnswerDistribution[];
}

export interface LeaderboardEntry {
  participantId: string;
  nickname: string;
  pointsTotal: number;
  rank: number;
}

export interface LeaderboardUpdatedEvent {
  type: typeof RealtimeEventType.LEADERBOARD_UPDATED;
  entries: LeaderboardEntry[];
}

export interface GameEndedEvent {
  type: typeof RealtimeEventType.GAME_ENDED;
  podium: LeaderboardEntry[];
}

// ============================================
// Union type for all events
// ============================================

export type RealtimeEvent =
  | LobbyUpdatedEvent
  | QuestionStartedEvent
  | QuestionClosedEvent
  | AnswerRevealEvent
  | LeaderboardUpdatedEvent
  | GameEndedEvent;

// ============================================
// Helper functions
// ============================================

export function createLobbyUpdatedEvent(
  participantCount: number,
  participants: LobbyParticipant[]
): LobbyUpdatedEvent {
  return {
    type: RealtimeEventType.LOBBY_UPDATED,
    participantCount,
    participants,
  };
}

export function createQuestionStartedEvent(
  question: RealtimeQuestion,
  questionIndex: number,
  totalQuestions: number
): QuestionStartedEvent {
  return {
    type: RealtimeEventType.QUESTION_STARTED,
    question,
    questionIndex,
    totalQuestions,
  };
}

export function createQuestionClosedEvent(
  questionId: string
): QuestionClosedEvent {
  return {
    type: RealtimeEventType.QUESTION_CLOSED,
    questionId,
  };
}

export function createAnswerRevealEvent(
  questionId: string,
  correctOptionId: string,
  distribution: AnswerDistribution[]
): AnswerRevealEvent {
  return {
    type: RealtimeEventType.ANSWER_REVEAL,
    questionId,
    correctOptionId,
    distribution,
  };
}

export function createLeaderboardUpdatedEvent(
  entries: LeaderboardEntry[]
): LeaderboardUpdatedEvent {
  return {
    type: RealtimeEventType.LEADERBOARD_UPDATED,
    entries,
  };
}

export function createGameEndedEvent(
  podium: LeaderboardEntry[]
): GameEndedEvent {
  return {
    type: RealtimeEventType.GAME_ENDED,
    podium,
  };
}
