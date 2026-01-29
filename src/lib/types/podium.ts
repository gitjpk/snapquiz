/**
 * Podium Animation Types
 * 
 * Defines the phases of the animated podium reveal sequence.
 */

/**
 * Animation phases for the podium reveal sequence.
 * Timeline (standard flow, 10 seconds total):
 * - idle: Animation not started
 * - drumroll: 0s - Anticipation phase, empty podiums fade in
 * - reveal-3rd: 2s - 3rd place being revealed
 * - reveal-2nd: 4s - 2nd place being revealed  
 * - reveal-1st: 6.5s - 1st place being revealed with fanfare
 * - celebration: 7s - Confetti and applause
 * - complete: 10s - Static final display
 */
export type PodiumAnimationPhase =
  | "idle"
  | "drumroll"
  | "reveal-3rd"
  | "reveal-2nd"
  | "reveal-1st"
  | "celebration"
  | "complete";

/**
 * Animation timing configuration (in milliseconds)
 */
export const PODIUM_TIMING = {
  /** Delay before starting drumroll */
  START_DELAY: 0,
  /** Duration of drumroll phase */
  DRUMROLL_DURATION: 2000,
  /** Time between 3rd and 2nd place reveal */
  REVEAL_INTERVAL: 2000,
  /** Extra delay before 1st place for dramatic effect */
  FIRST_PLACE_DELAY: 500,
  /** Duration of celebration phase */
  CELEBRATION_DURATION: 3000,
  /** Total animation duration */
  TOTAL_DURATION: 10000,
  /** Reduced motion duration */
  REDUCED_MOTION_DURATION: 500,
} as const;

/**
 * Phase transition map for the state machine
 */
export const PHASE_TRANSITIONS: Record<PodiumAnimationPhase, PodiumAnimationPhase | null> = {
  idle: "drumroll",
  drumroll: "reveal-3rd",
  "reveal-3rd": "reveal-2nd",
  "reveal-2nd": "reveal-1st",
  "reveal-1st": "celebration",
  celebration: "complete",
  complete: null, // Terminal state
};

/**
 * Check if a phase is a reveal phase
 */
export function isRevealPhase(phase: PodiumAnimationPhase): boolean {
  return phase === "reveal-3rd" || phase === "reveal-2nd" || phase === "reveal-1st";
}

/**
 * Get the place number being revealed (or null if not a reveal phase)
 */
export function getRevealPlace(phase: PodiumAnimationPhase): 1 | 2 | 3 | null {
  switch (phase) {
    case "reveal-3rd":
      return 3;
    case "reveal-2nd":
      return 2;
    case "reveal-1st":
      return 1;
    default:
      return null;
  }
}
