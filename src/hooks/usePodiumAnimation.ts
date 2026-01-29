"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type PodiumAnimationPhase,
  PODIUM_TIMING,
  PHASE_TRANSITIONS,
} from "@/lib/types/podium";
import { useReducedMotion } from "./useReducedMotion";

interface UsePodiumAnimationOptions {
  /** Whether to auto-start the animation */
  autoStart?: boolean;
  /** Callback fired when phase changes */
  onPhaseChange?: (phase: PodiumAnimationPhase) => void;
  /** Callback fired when animation completes */
  onComplete?: () => void;
  /** Number of participants (affects which phases to show) */
  participantCount?: number;
}

interface UsePodiumAnimationReturn {
  /** Current animation phase */
  phase: PodiumAnimationPhase;
  /** Start the animation from idle */
  start: () => void;
  /** Reset to idle state */
  reset: () => void;
  /** Skip to complete state */
  skipToEnd: () => void;
  /** Whether animation is currently running */
  isAnimating: boolean;
  /** Whether reduced motion is active */
  isReducedMotion: boolean;
}

/**
 * Hook to manage podium animation state machine.
 * 
 * Timeline (standard flow, 10 seconds total):
 * - idle → drumroll (0s)
 * - drumroll → reveal-3rd (2s)
 * - reveal-3rd → reveal-2nd (4s)
 * - reveal-2nd → reveal-1st (6.5s)
 * - reveal-1st → celebration (7s)
 * - celebration → complete (10s)
 * 
 * Reduced motion: idle → complete (immediate)
 */
export function usePodiumAnimation(
  options: UsePodiumAnimationOptions = {}
): UsePodiumAnimationReturn {
  const {
    autoStart = false,
    onPhaseChange,
    onComplete,
    participantCount = 3,
  } = options;

  const [phase, setPhase] = useState<PodiumAnimationPhase>("idle");
  const prefersReducedMotion = useReducedMotion();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);

  // Clear any pending timeouts
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Get delay for transitioning to next phase
  const getPhaseDelay = useCallback(
    (currentPhase: PodiumAnimationPhase): number => {
      switch (currentPhase) {
        case "idle":
          return PODIUM_TIMING.START_DELAY;
        case "drumroll":
          return PODIUM_TIMING.DRUMROLL_DURATION;
        case "reveal-3rd":
          // Skip to reveal-1st if only 2 participants
          if (participantCount < 3) {
            return 0; // Immediate transition
          }
          return PODIUM_TIMING.REVEAL_INTERVAL;
        case "reveal-2nd":
          return PODIUM_TIMING.REVEAL_INTERVAL + PODIUM_TIMING.FIRST_PLACE_DELAY;
        case "reveal-1st":
          return PODIUM_TIMING.FIRST_PLACE_DELAY;
        case "celebration":
          return PODIUM_TIMING.CELEBRATION_DURATION;
        case "complete":
          return 0; // No transition from complete
        default:
          return 0;
      }
    },
    [participantCount]
  );

  // Get next phase, skipping phases if needed based on participant count
  const getNextPhase = useCallback(
    (currentPhase: PodiumAnimationPhase): PodiumAnimationPhase | null => {
      const standardNext = PHASE_TRANSITIONS[currentPhase];
      
      // Skip reveal-3rd if fewer than 3 participants
      if (standardNext === "reveal-3rd" && participantCount < 3) {
        return "reveal-2nd";
      }
      
      // Skip reveal-2nd if only 1 participant (shouldn't happen due to minimum check)
      if (standardNext === "reveal-2nd" && participantCount < 2) {
        return "reveal-1st";
      }
      
      return standardNext;
    },
    [participantCount]
  );

  // Transition to next phase
  const transitionToNextPhase = useCallback(() => {
    setPhase((currentPhase) => {
      const nextPhase = getNextPhase(currentPhase);
      
      if (nextPhase) {
        return nextPhase;
      }
      
      return currentPhase;
    });
  }, [getNextPhase]);

  // Handle phase changes
  useEffect(() => {
    // Notify phase change
    onPhaseChange?.(phase);

    // Check if complete
    if (phase === "complete") {
      onComplete?.();
      return;
    }

    // Schedule next transition if animating
    if (phase !== "idle") {
      const delay = getPhaseDelay(phase);
      
      if (delay > 0) {
        timeoutRef.current = setTimeout(transitionToNextPhase, delay);
      } else {
        // Immediate transition
        transitionToNextPhase();
      }
    }

    return () => {
      clearPendingTimeout();
    };
  }, [phase, getPhaseDelay, transitionToNextPhase, clearPendingTimeout, onPhaseChange, onComplete]);

  // Start animation
  const start = useCallback(() => {
    if (phase !== "idle") return;
    
    hasStartedRef.current = true;

    // If reduced motion, skip directly to complete
    if (prefersReducedMotion) {
      setTimeout(() => {
        setPhase("complete");
      }, PODIUM_TIMING.REDUCED_MOTION_DURATION);
      return;
    }

    // Start normal animation
    setPhase("drumroll");
  }, [phase, prefersReducedMotion]);

  // Reset to idle
  const reset = useCallback(() => {
    clearPendingTimeout();
    hasStartedRef.current = false;
    setPhase("idle");
  }, [clearPendingTimeout]);

  // Skip to end
  const skipToEnd = useCallback(() => {
    clearPendingTimeout();
    setPhase("complete");
  }, [clearPendingTimeout]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !hasStartedRef.current && phase === "idle") {
      start();
    }
  }, [autoStart, phase, start]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingTimeout();
    };
  }, [clearPendingTimeout]);

  return {
    phase,
    start,
    reset,
    skipToEnd,
    isAnimating: phase !== "idle" && phase !== "complete",
    isReducedMotion: prefersReducedMotion,
  };
}
