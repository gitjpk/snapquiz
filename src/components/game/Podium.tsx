"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/realtime/events";

interface PodiumProps {
  /** Top 3 entries for the podium */
  entries: LeaderboardEntry[];
  /** Current participant ID (to highlight if they're on podium) */
  currentParticipantId?: string;
  /** Whether this is the presenter view (larger styling) */
  isPresenter?: boolean;
}

export function Podium({
  entries,
  currentParticipantId,
  isPresenter = false,
}: PodiumProps) {
  // Ensure we have at least 3 entries (pad with empty if needed)
  const podiumEntries = [
    entries[0] || null, // 1st place
    entries[1] || null, // 2nd place
    entries[2] || null, // 3rd place
  ];

  const first = podiumEntries[0];
  const second = podiumEntries[1];
  const third = podiumEntries[2];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <span className={cn("text-6xl", isPresenter && "text-8xl")}>🏆</span>
        <h2
          className={cn(
            "mt-4 font-bold",
            isPresenter ? "text-4xl" : "text-2xl"
          )}
        >
          Final Results
        </h2>
      </div>

      {/* Podium visualization */}
      <div className="flex items-end justify-center gap-2 md:gap-4">
        {/* 2nd Place */}
        <div className="flex flex-col items-center">
          <PodiumEntry
            entry={second}
            place={2}
            isCurrentUser={second?.participantId === currentParticipantId}
            isPresenter={isPresenter}
          />
          <div
            className={cn(
              "w-24 rounded-t-lg bg-gradient-to-b from-slate-300 to-slate-400 md:w-32",
              isPresenter ? "h-24" : "h-20"
            )}
          />
        </div>

        {/* 1st Place */}
        <div className="flex flex-col items-center">
          <PodiumEntry
            entry={first}
            place={1}
            isCurrentUser={first?.participantId === currentParticipantId}
            isPresenter={isPresenter}
          />
          <div
            className={cn(
              "w-28 rounded-t-lg bg-gradient-to-b from-yellow-400 to-yellow-500 md:w-36",
              isPresenter ? "h-32" : "h-28"
            )}
          />
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center">
          <PodiumEntry
            entry={third}
            place={3}
            isCurrentUser={third?.participantId === currentParticipantId}
            isPresenter={isPresenter}
          />
          <div
            className={cn(
              "w-24 rounded-t-lg bg-gradient-to-b from-orange-400 to-orange-500 md:w-32",
              isPresenter ? "h-16" : "h-12"
            )}
          />
        </div>
      </div>

      {/* Detailed list below podium */}
      <div className="space-y-2">
        {podiumEntries.map(
          (entry, index) =>
            entry && (
              <div
                key={entry.participantId}
                className={cn(
                  "flex items-center justify-between rounded-lg p-4",
                  entry.participantId === currentParticipantId
                    ? "bg-primary/20 ring-2 ring-primary"
                    : index === 0
                    ? "bg-yellow-500/20"
                    : index === 1
                    ? "bg-slate-400/20"
                    : "bg-orange-500/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("text-2xl", isPresenter && "text-4xl")}>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </span>
                  <span
                    className={cn(
                      "font-bold",
                      isPresenter ? "text-2xl" : "text-lg"
                    )}
                  >
                    {entry.nickname}
                  </span>
                </div>
                <span
                  className={cn(
                    "font-bold",
                    isPresenter ? "text-2xl" : "text-lg"
                  )}
                >
                  {entry.pointsTotal.toLocaleString()} pts
                </span>
              </div>
            )
        )}
      </div>
    </div>
  );
}

interface PodiumEntryProps {
  entry: LeaderboardEntry | null;
  place: 1 | 2 | 3;
  isCurrentUser: boolean;
  isPresenter: boolean;
}

function PodiumEntry({
  entry,
  place,
  isCurrentUser,
  isPresenter,
}: PodiumEntryProps) {
  if (!entry) {
    return (
      <div className="mb-2 text-center">
        <div
          className={cn(
            "mx-auto flex items-center justify-center rounded-full bg-muted",
            isPresenter ? "h-16 w-16" : "h-12 w-12"
          )}
        >
          <span className="text-muted-foreground">-</span>
        </div>
      </div>
    );
  }

  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";

  return (
    <div className="mb-2 text-center">
      <span className={cn("text-3xl", isPresenter && "text-5xl")}>{medal}</span>
      <div
        className={cn(
          "mt-1 rounded-lg px-3 py-1",
          isCurrentUser && "bg-primary/20 ring-2 ring-primary"
        )}
      >
        <p
          className={cn(
            "font-bold",
            isPresenter ? "text-xl" : "text-base"
          )}
        >
          {entry.nickname}
        </p>
        <p
          className={cn(
            "text-muted-foreground",
            isPresenter ? "text-lg" : "text-sm"
          )}
        >
          {entry.pointsTotal.toLocaleString()} pts
        </p>
      </div>
    </div>
  );
}
