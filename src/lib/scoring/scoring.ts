/**
 * Scoring algorithm for SnapQuiz
 * Awards points based on correctness and speed.
 */

/** Maximum points for a correct answer */
export const MAX_POINTS = 1000;

/** Minimum points for a correct answer (answered at the last second) */
export const MIN_POINTS = 500;

/** Points for an incorrect answer */
export const INCORRECT_POINTS = 0;

/**
 * Calculate points for an answer based on correctness and response time.
 * 
 * @param isCorrect - Whether the answer was correct
 * @param responseTimeMs - Time taken to respond in milliseconds
 * @param timeLimitMs - Total time limit for the question in milliseconds
 * @returns Points awarded (0 for incorrect, 500-1000 for correct based on speed)
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
  
  // Calculate speed bonus (faster = more points)
  // At time 0: full points (1000)
  // At time limit: minimum points (500)
  const speedRatio = 1 - clampedTime / timeLimitMs;
  const speedBonus = Math.round((MAX_POINTS - MIN_POINTS) * speedRatio);
  
  return MIN_POINTS + speedBonus;
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
