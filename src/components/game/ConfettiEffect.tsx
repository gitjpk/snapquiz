"use client";

import { useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";

export interface ConfettiEffectProps {
  /**
   * Trigger confetti burst when true
   */
  trigger: boolean;
  /**
   * Duration of confetti effect in ms
   * @default 3000
   */
  duration?: number;
  /**
   * Number of confetti particles per burst
   * @default 100
   */
  particleCount?: number;
  /**
   * Whether to optimize for mobile (fewer particles)
   * @default false
   */
  isMobile?: boolean;
  /**
   * Callback when confetti animation completes
   */
  onComplete?: () => void;
  /**
   * Whether to skip animation (for reduced motion preference)
   * @default false
   */
  skipAnimation?: boolean;
}

/**
 * Confetti celebration effect component.
 * Uses canvas-confetti library for GPU-accelerated particles.
 * Automatically adjusts particle count for mobile devices.
 */
export function ConfettiEffect({
  trigger,
  duration = 3000,
  particleCount = 100,
  isMobile = false,
  onComplete,
  skipAnimation = false,
}: ConfettiEffectProps) {
  const hasTriggeredRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Adjust particle count for mobile
  const adjustedParticleCount = isMobile
    ? Math.floor(particleCount * 0.5)
    : particleCount;

  const fireConfetti = useCallback(() => {
    if (skipAnimation) {
      onComplete?.();
      return;
    }

    // Gold, silver, bronze colors to match podium theme
    const colors = ["#FFD700", "#C0C0C0", "#CD7F32", "#FF6B6B", "#4ECDC4"];

    // First burst - center
    confetti({
      particleCount: adjustedParticleCount,
      spread: 70,
      origin: { y: 0.6, x: 0.5 },
      colors,
      disableForReducedMotion: true,
    });

    // Delayed bursts from sides for more dramatic effect
    setTimeout(() => {
      if (skipAnimation) return;
      confetti({
        particleCount: Math.floor(adjustedParticleCount * 0.5),
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
    }, 150);

    setTimeout(() => {
      if (skipAnimation) return;
      confetti({
        particleCount: Math.floor(adjustedParticleCount * 0.5),
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
    }, 300);

    // Multiple bursts over duration
    const burstInterval = duration / 4;
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => {
        if (skipAnimation) return;
        confetti({
          particleCount: Math.floor(adjustedParticleCount * 0.3),
          spread: 100,
          origin: { y: 0.5 + Math.random() * 0.2, x: Math.random() },
          colors,
          disableForReducedMotion: true,
        });
      }, burstInterval * i);
    }
  }, [adjustedParticleCount, duration, onComplete, skipAnimation]);

  useEffect(() => {
    if (trigger && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      fireConfetti();

      // Call onComplete after duration
      timeoutRef.current = setTimeout(() => {
        onComplete?.();
      }, duration);
    }

    // Reset when trigger becomes false
    if (!trigger) {
      hasTriggeredRef.current = false;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [trigger, fireConfetti, duration, onComplete]);

  // This component doesn't render anything - confetti uses its own canvas
  return null;
}

export default ConfettiEffect;
