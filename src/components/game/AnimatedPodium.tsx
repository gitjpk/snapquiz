"use client";

import { useCallback } from "react";
import { usePodiumAnimation } from "@/hooks/usePodiumAnimation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ConfettiEffect } from "./ConfettiEffect";
import {
  PodiumAnimationPhase,
} from "@/lib/types/podium";
import { cn } from "@/lib/utils";

/**
 * WCAG 2.1 Compliance Notes (A11y):
 *
 * 1. Reduced Motion Support (WCAG 2.3.3):
 *    - Detects prefers-reduced-motion media query via useReducedMotion hook
 *    - Skips all animations and shows final state immediately when enabled
 *    - CSS animations also respect @media (prefers-reduced-motion: reduce)
 *
 * 2. Confetti Accessibility:
 *    - canvas-confetti has built-in disableForReducedMotion option
 *    - Confetti is skipped entirely when reduced motion is preferred
 *
 * 3. Content Accessibility:
 *    - All content is visible without requiring animation completion
 *    - Text has sufficient color contrast
 *    - Semantic HTML structure maintained
 *
 * 4. Keyboard Navigation:
 *    - Skip animation button is focusable
 *    - No keyboard traps during animation
 */

export interface PodiumParticipant {
  id: string;
  name: string;
  score: number;
  rank: 1 | 2 | 3;
}

export interface AnimatedPodiumProps {
  /**
   * Top 3 participants to display (must be sorted by rank)
   */
  participants: PodiumParticipant[];
  /**
   * Whether to auto-start animation
   * @default true
   */
  autoStart?: boolean;
  /**
   * Whether this is the presenter view (plays audio)
   * @default false
   */
  isPresenter?: boolean;
  /**
   * Whether running on mobile device
   * @default false
   */
  isMobile?: boolean;
  /**
   * Callback when animation completes
   */
  onComplete?: () => void;
  /**
   * Callback when phase changes (for audio sync)
   */
  onPhaseChange?: (phase: PodiumAnimationPhase) => void;
  /**
   * Additional class name for container
   */
  className?: string;
}

/**
 * Animated podium component with progressive reveal.
 * Shows 3rd place first, then 2nd, then 1st with celebration.
 * Automatically handles reduced motion preferences.
 */
export function AnimatedPodium({
  participants,
  autoStart = true,
  isPresenter = false,
  isMobile = false,
  onComplete,
  onPhaseChange,
  className,
}: AnimatedPodiumProps) {
  const reducedMotion = useReducedMotion();
  const participantCount = participants.length;

  // Edge case: No participants
  if (participantCount === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <p className="text-muted-foreground">No results to display</p>
      </div>
    );
  }

  // Edge case: Single participant - simplified results, no animation
  if (participantCount === 1) {
    const winner = participants[0];
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 gap-4", className)}>
        <div className="text-6xl">🏆</div>
        <h2 className="text-2xl font-bold">Winner!</h2>
        <div className="text-4xl font-bold text-primary">{winner.name}</div>
        <div className="text-xl text-muted-foreground">{winner.score} points</div>
      </div>
    );
  }

  return (
    <AnimatedPodiumInternal
      participants={participants}
      autoStart={autoStart}
      isPresenter={isPresenter}
      isMobile={isMobile}
      onComplete={onComplete}
      onPhaseChange={onPhaseChange}
      className={className}
      reducedMotion={reducedMotion}
    />
  );
}

// Internal component to avoid hooks in conditional returns
function AnimatedPodiumInternal({
  participants,
  autoStart,
  isPresenter,
  isMobile,
  onComplete,
  onPhaseChange,
  className,
  reducedMotion,
}: AnimatedPodiumProps & { reducedMotion: boolean }) {
  const participantCount = participants.length;

  const { phase, skipToEnd, isAnimating } = usePodiumAnimation({
    autoStart,
    participantCount,
    onPhaseChange,
    onComplete,
  });

  // Get participant by rank
  const getParticipant = useCallback(
    (rank: 1 | 2 | 3): PodiumParticipant | undefined => {
      return participants.find((p) => p.rank === rank);
    },
    [participants]
  );

  const first = getParticipant(1);
  const second = getParticipant(2);
  const third = getParticipant(3);

  // Determine visibility based on current phase
  const isVisible = useCallback(
    (rank: 1 | 2 | 3): boolean => {
      if (reducedMotion || phase === "complete") return true;
      if (phase === "idle" || phase === "drumroll") return false;

      // Check each reveal phase
      if (phase === "reveal-3rd") return rank === 3;
      if (phase === "reveal-2nd") return rank >= 2;
      if (phase === "reveal-1st" || phase === "celebration") return true;

      return false;
    },
    [phase, reducedMotion]
  );

  // Show confetti during celebration phase
  const showConfetti =
    phase === "celebration" || phase === "complete";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center min-h-[400px] p-4",
        className
      )}
    >
      {/* Confetti effect */}
      <ConfettiEffect
        trigger={showConfetti && !reducedMotion}
        isMobile={isMobile}
        skipAnimation={reducedMotion}
      />

      {/* Drumroll phase indicator */}
      {phase === "drumroll" && !reducedMotion && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-center animate-drumroll-shake">
            <div className="text-6xl mb-4">🥁</div>
            <p className="text-2xl font-bold text-primary">
              And the winners are...
            </p>
          </div>
        </div>
      )}

      {/* Podium container */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 w-full max-w-2xl">
        {/* 2nd Place - Left */}
        {second && (
          <PodiumPosition
            participant={second}
            rank={2}
            isVisible={isVisible(2)}
            reducedMotion={reducedMotion}
            phase={phase}
          />
        )}

        {/* 1st Place - Center (taller) */}
        {first && (
          <PodiumPosition
            participant={first}
            rank={1}
            isVisible={isVisible(1)}
            reducedMotion={reducedMotion}
            phase={phase}
          />
        )}

        {/* 3rd Place - Right */}
        {third && (
          <PodiumPosition
            participant={third}
            rank={3}
            isVisible={isVisible(3)}
            reducedMotion={reducedMotion}
            phase={phase}
          />
        )}
      </div>

      {/* Skip button for presenter during animation */}
      {isPresenter && isAnimating && !reducedMotion && (
        <button
          onClick={skipToEnd}
          className="mt-8 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip animation →
        </button>
      )}
    </div>
  );
}

interface PodiumPositionProps {
  participant: PodiumParticipant;
  rank: 1 | 2 | 3;
  isVisible: boolean;
  reducedMotion: boolean;
  phase: PodiumAnimationPhase;
}

function PodiumPosition({
  participant,
  rank,
  isVisible,
  reducedMotion,
  phase,
}: PodiumPositionProps) {
  // Podium heights based on rank
  const heightClass = {
    1: "h-40 sm:h-48",
    2: "h-32 sm:h-40",
    3: "h-24 sm:h-32",
  }[rank];

  // Medal colors
  const medalColors = {
    1: "bg-gradient-to-b from-yellow-400 to-yellow-600",
    2: "bg-gradient-to-b from-gray-300 to-gray-500",
    3: "bg-gradient-to-b from-amber-600 to-amber-800",
  }[rank];

  // Glow animation class
  const glowClass = {
    1: "animate-podium-glow",
    2: "animate-podium-glow-silver",
    3: "animate-podium-glow-bronze",
  }[rank];

  // Medal emoji
  const medal = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  }[rank];

  // Trophy for winner in celebration phase
  const showCrown =
    rank === 1 && (phase === "celebration" || phase === "complete");

  if (!isVisible && !reducedMotion) {
    // Placeholder to maintain layout
    return <div className={cn("flex-1 max-w-[180px]", heightClass)} />;
  }

  return (
    <div
      className={cn(
        "flex-1 max-w-[180px] flex flex-col items-center",
        !reducedMotion && "animate-podium-slide-up"
      )}
    >
      {/* Crown/trophy for winner */}
      {showCrown && !reducedMotion && (
        <div className="text-4xl mb-2 animate-crown-bounce">👑</div>
      )}

      {/* Participant card */}
      <div
        className={cn(
          "w-full rounded-t-lg p-3 text-center bg-card border border-b-0",
          !reducedMotion && phase !== "complete" && glowClass
        )}
      >
        {/* Medal */}
        <div className="text-3xl sm:text-4xl mb-1">{medal}</div>

        {/* Name */}
        <div className="font-bold text-sm sm:text-base truncate px-1">
          {participant.name}
        </div>

        {/* Score */}
        <div className="text-xs sm:text-sm text-muted-foreground">
          {participant.score} pts
        </div>
      </div>

      {/* Podium block */}
      <div
        className={cn(
          "w-full rounded-b-lg flex items-center justify-center",
          heightClass,
          medalColors
        )}
      >
        <span className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">
          {rank}
        </span>
      </div>
    </div>
  );
}

export default AnimatedPodium;
