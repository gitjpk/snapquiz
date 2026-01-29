/**
 * Scoring algorithm for SnapQuiz
 * Awards points based on correctness and speed.
 * 
 * Formula: Points = MAX_POINTS * (timeRemaining / timeLimit)
 * - Faster answers = more points
 * - Answer at time 0 = 1000 points
 * - Answer at time limit = 0 points
 */

/** Maximum points for a correct answer (answered instantly) */
export const MAX_POINTS = 1000;

/** Points for an incorrect answer */
export const INCORRECT_POINTS = 0;

/**
 * Calculate points for an answer based on correctness and response time.
 * 
 * Formula: Points = MAX_POINTS * (timeRemaining / timeLimit)
 * Example: 30s limit, answered in 10s → Points = 1000 * (20/30) = 667
 * 
 * @param isCorrect - Whether the answer was correct
 * @param responseTimeMs - Time taken to respond in milliseconds
 * @param timeLimitMs - Total time limit for the question in milliseconds
 * @returns Points awarded (0 for incorrect, 0-1000 for correct based on speed)
 */
export function calculatePoints(
  isCorrect: boolean,
  responseTimeMs: number,
  timeLimitMs: number
): number {
  if (!isCorrect) {
    return INCORRECT_POINTS;
  }

  // Ensure time is within bounds
  const clampedTime = Math.max(0, Math.min(responseTimeMs, timeLimitMs));
  
  // Calculate time remaining ratio
  const timeRemainingMs = timeLimitMs - clampedTime;
  const timeRemainingRatio = timeRemainingMs / timeLimitMs;
  
  // Points = MAX_POINTS * (timeRemaining / timeLimit)
  return Math.round(MAX_POINTS * timeRemainingRatio);
}

/**
 * Calculate points with question start timestamp comparison.
 * 
 * @param isCorrect - Whether the answer was correct
 * @param questionStartedAt - When the question was started
 * @param answeredAt - When the answer was submitted
 * @param timeLimitSeconds - Time limit in seconds
 * @returns Points awarded
 */
export function calculatePointsFromTimestamps(
  isCorrect: boolean,
  questionStartedAt: Date,
  answeredAt: Date,
  timeLimitSeconds: number
): number {
  const responseTimeMs = answeredAt.getTime() - questionStartedAt.getTime();
  const timeLimitMs = timeLimitSeconds * 1000;
  
  return calculatePoints(isCorrect, responseTimeMs, timeLimitMs);
}

/**
 * Format points for display (e.g., "1,000 pts")
 */
export function formatPoints(points: number): string {
  return `${points.toLocaleString()} pts`;
}
