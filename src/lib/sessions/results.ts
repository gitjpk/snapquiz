import prisma from "@/lib/db/client";
import type { AnswerDistribution } from "@/lib/realtime/events";

/**
 * Compute answer distribution for a question in a session.
 */
export async function computeAnswerDistribution(
  sessionId: string,
  questionId: string
): Promise<AnswerDistribution[]> {
  // Get all options for the question
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      answerOptions: {
        orderBy: { orderIndex: "asc" },
        select: { id: true },
      },
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  // Count responses per option
  const responses = await prisma.response.groupBy({
    by: ["selectedOptionId"],
    where: {
      sessionId,
      questionId,
    },
    _count: true,
  });

  // Map to distribution format, ensuring all options are included
  const distribution: AnswerDistribution[] = question.answerOptions.map(
    (option) => ({
      optionId: option.id,
      count:
        responses.find((r) => r.selectedOptionId === option.id)?._count ?? 0,
    })
  );

  return distribution;
}

/**
 * Get the total number of responses for a question in a session.
 */
export async function getResponseCount(
  sessionId: string,
  questionId: string
): Promise<number> {
  return prisma.response.count({
    where: {
      sessionId,
      questionId,
    },
  });
}

/**
 * Get percentage breakdown for each option.
 */
export function calculatePercentages(
  distribution: AnswerDistribution[]
): Array<{ optionId: string; count: number; percentage: number }> {
  const total = distribution.reduce((sum, d) => sum + d.count, 0);

  return distribution.map((d) => ({
    optionId: d.optionId,
    count: d.count,
    percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }));
}
