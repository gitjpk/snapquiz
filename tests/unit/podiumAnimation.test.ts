import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePodiumAnimation } from "@/hooks/usePodiumAnimation";
import { PODIUM_TIMING } from "@/lib/types/podium";

// Mock useReducedMotion
const mockUseReducedMotion = vi.fn(() => false);
vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

describe("usePodiumAnimation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("starts in idle phase", () => {
    const { result } = renderHook(() => usePodiumAnimation());
    expect(result.current.phase).toBe("idle");
    expect(result.current.isAnimating).toBe(false);
  });

  it("transitions through phases when started", async () => {
    const onPhaseChange = vi.fn();
    const { result } = renderHook(() =>
      usePodiumAnimation({ onPhaseChange })
    );

    // Start animation
    act(() => {
      result.current.start();
    });

    expect(result.current.phase).toBe("drumroll");
    expect(result.current.isAnimating).toBe(true);

    // Advance to reveal-3rd
    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.DRUMROLL_DURATION);
    });
    expect(result.current.phase).toBe("reveal-3rd");

    // Advance to reveal-2nd
    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.REVEAL_INTERVAL);
    });
    expect(result.current.phase).toBe("reveal-2nd");

    // Advance to reveal-1st
    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.REVEAL_INTERVAL + PODIUM_TIMING.FIRST_PLACE_DELAY);
    });
    expect(result.current.phase).toBe("reveal-1st");

    // Advance to celebration
    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.FIRST_PLACE_DELAY);
    });
    expect(result.current.phase).toBe("celebration");

    // Advance to complete
    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.CELEBRATION_DURATION);
    });
    expect(result.current.phase).toBe("complete");
    expect(result.current.isAnimating).toBe(false);
  });

  it("calls onComplete when animation finishes", async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      usePodiumAnimation({ onComplete })
    );

    act(() => {
      result.current.start();
    });

    // Fast-forward through all phases with proper timing
    // drumroll
    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.DRUMROLL_DURATION);
    });
    // reveal-3rd -> reveal-2nd
    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.REVEAL_INTERVAL);
    });
    // reveal-2nd -> reveal-1st
    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.REVEAL_INTERVAL + PODIUM_TIMING.FIRST_PLACE_DELAY);
    });
    // reveal-1st -> celebration
    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.FIRST_PLACE_DELAY);
    });
    // celebration -> complete
    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.CELEBRATION_DURATION);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("can skip to end", () => {
    const { result } = renderHook(() => usePodiumAnimation());

    act(() => {
      result.current.start();
    });

    expect(result.current.phase).toBe("drumroll");

    act(() => {
      result.current.skipToEnd();
    });

    expect(result.current.phase).toBe("complete");
    expect(result.current.isAnimating).toBe(false);
  });

  it("can reset to idle", () => {
    const { result } = renderHook(() => usePodiumAnimation());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.DRUMROLL_DURATION);
    });

    expect(result.current.phase).toBe("reveal-3rd");

    act(() => {
      result.current.reset();
    });

    expect(result.current.phase).toBe("idle");
    expect(result.current.isAnimating).toBe(false);
  });

  it("skips reveal-3rd when only 2 participants", () => {
    const { result } = renderHook(() =>
      usePodiumAnimation({ participantCount: 2 })
    );

    act(() => {
      result.current.start();
    });

    // Advance past drumroll
    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.DRUMROLL_DURATION);
    });

    // Should skip directly to reveal-2nd
    expect(result.current.phase).toBe("reveal-2nd");
  });

  it("auto-starts when autoStart is true", () => {
    const { result } = renderHook(() =>
      usePodiumAnimation({ autoStart: true })
    );

    // Should automatically start
    expect(result.current.phase).toBe("drumroll");
  });

  it("does not restart if already running", () => {
    const { result } = renderHook(() => usePodiumAnimation());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.DRUMROLL_DURATION);
    });

    expect(result.current.phase).toBe("reveal-3rd");

    // Try to start again - should have no effect
    act(() => {
      result.current.start();
    });

    expect(result.current.phase).toBe("reveal-3rd");
  });
});

describe("usePodiumAnimation with reduced motion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock reduced motion preference
    mockUseReducedMotion.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    mockUseReducedMotion.mockReturnValue(false);
  });

  it("skips to complete immediately when reduced motion is preferred", () => {
    const { result } = renderHook(() => usePodiumAnimation());

    act(() => {
      result.current.start();
    });

    // Should transition to complete after reduced motion duration
    act(() => {
      vi.advanceTimersByTime(PODIUM_TIMING.REDUCED_MOTION_DURATION);
    });

    expect(result.current.phase).toBe("complete");
    expect(result.current.isReducedMotion).toBe(true);
  });
});
