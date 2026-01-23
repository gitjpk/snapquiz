"use client";

import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnswerDistribution, RealtimeOption } from "@/lib/realtime/events";

interface AnswerRevealProps {
  /** Question prompt text */
  prompt: string;
  /** All answer options */
  options: RealtimeOption[];
  /** The correct option ID */
  correctOptionId: string;
  /** Distribution of answers */
  distribution: AnswerDistribution[];
  /** The participant's selected option (optional - for player view) */
  selectedOptionId?: string;
}

// Color palette for answer options
const optionColors = [
  { bg: "bg-red-500", ring: "ring-red-300" },
  { bg: "bg-blue-500", ring: "ring-blue-300" },
  { bg: "bg-yellow-500", ring: "ring-yellow-300" },
  { bg: "bg-green-500", ring: "ring-green-300" },
  { bg: "bg-purple-500", ring: "ring-purple-300" },
  { bg: "bg-orange-500", ring: "ring-orange-300" },
];

/**
 * Displays the answer reveal with correct answer highlighted
 * and response distribution bar chart.
 */
export function AnswerReveal({
  prompt,
  options,
  correctOptionId,
  distribution,
  selectedOptionId,
}: AnswerRevealProps) {
  const totalResponses = distribution.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      {/* Question prompt */}
      <div className="text-center">
        <h2 className="text-2xl font-bold md:text-3xl">{prompt}</h2>
      </div>

      {/* Options with results */}
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option, index) => {
          const isCorrect = option.id === correctOptionId;
          const isSelected = option.id === selectedOptionId;
          const dist = distribution.find((d) => d.optionId === option.id);
          const count = dist?.count ?? 0;
          const percentage =
            totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
          const colors = optionColors[index % optionColors.length];

          return (
            <div
              key={option.id}
              className={cn(
                "relative overflow-hidden rounded-lg p-4 text-white transition-all",
                colors.bg,
                isCorrect && "ring-4 ring-green-400",
                !isCorrect && "opacity-60"
              )}
            >
              {/* Option content */}
              <div className="relative z-10">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-lg font-semibold">{option.label}</span>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                        Your answer
                      </span>
                    )}
                    {isCorrect ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-400">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                        <X className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <Progress
                  value={percentage}
                  className="h-3 bg-white/30"
                />

                {/* Stats */}
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span>
                    {count} {count === 1 ? "response" : "responses"}
                  </span>
                  <span className="font-bold">{percentage}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="text-center text-muted-foreground">
        <p>
          {totalResponses} total{" "}
          {totalResponses === 1 ? "response" : "responses"}
        </p>
      </div>
    </div>
  );
}
