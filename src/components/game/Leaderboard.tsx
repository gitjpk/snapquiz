"use client";

import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/realtime/events";

interface LeaderboardProps {
  /** Leaderboard entries (already sorted by rank) */
  entries: LeaderboardEntry[];
  /** Current participant ID (to highlight their position) */
  currentParticipantId?: string;
  /** Maximum entries to show */
  maxEntries?: number;
  /** Whether this is the presenter view (larger styling) */
  isPresenter?: boolean;
  /** Previous leaderboard for showing rank changes */
  previousEntries?: LeaderboardEntry[];
}

export function Leaderboard({
  entries,
  currentParticipantId,
  maxEntries = 10,
  isPresenter = false,
  previousEntries,
}: LeaderboardProps) {
  const displayEntries = entries.slice(0, maxEntries);

  // Calculate rank changes if previous entries are provided
  const getRankChange = (
    entry: LeaderboardEntry
  ): "up" | "down" | "same" | null => {
    if (!previousEntries) return null;
    const previousEntry = previousEntries.find(
      (e) => e.participantId === entry.participantId
    );
    if (!previousEntry) return "up"; // New entry
    if (entry.rank < previousEntry.rank) return "up";
    if (entry.rank > previousEntry.rank) return "down";
    return "same";
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <Trophy className={cn("text-yellow-500", isPresenter ? "h-8 w-8" : "h-6 w-6")} />
        <h2 className={cn("font-bold", isPresenter ? "text-3xl" : "text-xl")}>
          Leaderboard
        </h2>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {displayEntries.map((entry, index) => {
          const isCurrentUser = entry.participantId === currentParticipantId;
          const rankChange = getRankChange(entry);

          return (
            <div
              key={entry.participantId}
              className={cn(
                "flex items-center justify-between rounded-lg p-3 transition-all",
                isPresenter ? "p-4" : "p-3",
                isCurrentUser
                  ? "bg-primary/20 ring-2 ring-primary"
                  : index === 0
                  ? "bg-yellow-500/20 ring-2 ring-yellow-400"
                  : index === 1
                  ? "bg-slate-400/20 ring-2 ring-slate-400"
                  : index === 2
                  ? "bg-orange-500/20 ring-2 ring-orange-400"
                  : "bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <span
                  className={cn(
                    "font-bold",
                    isPresenter ? "text-2xl" : "text-lg"
                  )}
                >
                  {index === 0
                    ? "🥇"
                    : index === 1
                    ? "🥈"
                    : index === 2
                    ? "🥉"
                    : `#${entry.rank}`}
                </span>

                {/* Name */}
                <span
                  className={cn(
                    "font-semibold",
                    isPresenter ? "text-xl" : "text-base"
                  )}
                >
                  {entry.nickname}
                </span>

                {/* Rank change indicator */}
                {rankChange && (
                  <span>
                    {rankChange === "up" && (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                    {rankChange === "down" && (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    {rankChange === "same" && (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                )}

                {/* Current user badge */}
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                )}
              </div>

              {/* Points */}
              <span
                className={cn(
                  "font-bold",
                  isPresenter ? "text-2xl" : "text-lg"
                )}
              >
                {entry.pointsTotal.toLocaleString()}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  pts
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Show more indicator */}
      {entries.length > maxEntries && (
        <p className="text-center text-sm text-muted-foreground">
          +{entries.length - maxEntries} more players
        </p>
      )}
    </div>
  );
}
