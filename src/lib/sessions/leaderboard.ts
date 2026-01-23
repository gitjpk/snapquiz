import prisma from "@/lib/db/client";
import type { LeaderboardEntry } from "@/lib/realtime/events";

/**
 * Compute leaderboard for a session.
 * 
 * @param sessionId - The session ID
 * @param topN - Number of top entries to return (default: 10)
 * @returns Array of leaderboard entries sorted by points (descending)
 */
export async function computeLeaderboard(
  sessionId: string,
  topN = 10
): Promise<LeaderboardEntry[]> {
  const scores = await prisma.score.findMany({
    where: { sessionId },
    orderBy: { pointsTotal: "desc" },
    take: topN,
    include: {
      participant: {
        select: { nickname: true },
      },
    },
  });

  return scores.map((score, index) => ({
    participantId: score.participantId,
    nickname: score.participant.nickname,
    pointsTotal: score.pointsTotal,
    rank: index + 1,
  }));
}

/**
 * Get a specific participant's rank and score.
 */
export async function getParticipantRank(
  sessionId: string,
  participantId: string
): Promise<LeaderboardEntry | null> {
  // Get the participant's score
  const participantScore = await prisma.score.findUnique({
    where: { participantId },
    include: {
      participant: {
        select: { nickname: true },
      },
    },
  });

  if (!participantScore) {
    return null;
  }

  // Count how many participants have a higher score
  const higherScoreCount = await prisma.score.count({
    where: {
      sessionId,
      pointsTotal: { gt: participantScore.pointsTotal },
    },
  });

  return {
    participantId: participantScore.participantId,
    nickname: participantScore.participant.nickname,
    pointsTotal: participantScore.pointsTotal,
    rank: higherScoreCount + 1,
  };
}

/**
 * Get the full leaderboard including a specific participant's position
 * even if they're not in the top N.
 */
export async function getLeaderboardWithParticipant(
  sessionId: string,
  participantId: string,
  topN = 5
): Promise<{
  topEntries: LeaderboardEntry[];
  participantEntry: LeaderboardEntry | null;
}> {
  const topEntries = await computeLeaderboard(sessionId, topN);
  
  // Check if participant is already in top entries
  const inTop = topEntries.some((e) => e.participantId === participantId);
  
  if (inTop) {
    return {
      topEntries,
      participantEntry: topEntries.find((e) => e.participantId === participantId)!,
    };
  }

  // Get participant's rank separately
  const participantEntry = await getParticipantRank(sessionId, participantId);

  return {
    topEntries,
    participantEntry,
  };
}
