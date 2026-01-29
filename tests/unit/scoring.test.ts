import { describe, it, expect } from "vitest";
import {
  calculatePoints,
  calculatePointsFromTimestamps,
  MAX_POINTS,
  INCORRECT_POINTS,
} from "@/lib/scoring/scoring";

describe("Scoring Algorithm", () => {
  describe("calculatePoints", () => {
    it("returns 0 for incorrect answers", () => {
      expect(calculatePoints(false, 0, 20000)).toBe(INCORRECT_POINTS);
      expect(calculatePoints(false, 10000, 20000)).toBe(INCORRECT_POINTS);
      expect(calculatePoints(false, 20000, 20000)).toBe(INCORRECT_POINTS);
    });

    it("returns max points for instant correct answer", () => {
      expect(calculatePoints(true, 0, 20000)).toBe(MAX_POINTS);
    });

    it("returns 0 points for answer at time limit", () => {
      // Answered exactly at time limit = 0 time remaining = 0 points
      expect(calculatePoints(true, 20000, 20000)).toBe(0);
    });

    it("returns proportional points based on time remaining", () => {
      // 30s limit, answered in 10s = 20s remaining = 2/3 of time
      // Points = 1000 * (20/30) = 667
      expect(calculatePoints(true, 10000, 30000)).toBe(667);
      
      // 20s limit, answered in 10s = 10s remaining = 1/2 of time
      // Points = 1000 * (10/20) = 500
      expect(calculatePoints(true, 10000, 20000)).toBe(500);
    });

    it("handles different time limits correctly", () => {
      // 5 second question, answered in 1 second = 4s remaining
      // Points = 1000 * (4/5) = 800
      expect(calculatePoints(true, 1000, 5000)).toBe(800);
    });

    it("clamps negative response time to 0", () => {
      // Negative time should be treated as 0 (instant answer)
      expect(calculatePoints(true, -1000, 20000)).toBe(MAX_POINTS);
    });

    it("clamps response time exceeding limit", () => {
      // Time exceeding limit should give 0 points
      expect(calculatePoints(true, 30000, 20000)).toBe(0);
    });
  });

  describe("calculatePointsFromTimestamps", () => {
    it("calculates points from Date objects", () => {
      const questionStarted = new Date("2026-01-20T10:00:00.000Z");
      const answered = new Date("2026-01-20T10:00:05.000Z"); // 5 seconds later
      const timeLimitSeconds = 20;

      // 5s response, 20s limit = 15s remaining
      // Points = 1000 * (15/20) = 750
      const points = calculatePointsFromTimestamps(
        true,
        questionStarted,
        answered,
        timeLimitSeconds
      );

      expect(points).toBe(750);
    });

    it("returns 0 for incorrect answers regardless of timing", () => {
      const questionStarted = new Date("2026-01-20T10:00:00.000Z");
      const answered = new Date("2026-01-20T10:00:01.000Z");

      const points = calculatePointsFromTimestamps(
        false,
        questionStarted,
        answered,
        20
      );

      expect(points).toBe(0);
    });
  });

  describe("Edge cases", () => {
    it("handles very short time limits", () => {
      // 1 second time limit
      expect(calculatePoints(true, 0, 1000)).toBe(1000);     // instant = 1000
      expect(calculatePoints(true, 500, 1000)).toBe(500);    // half time = 500
      expect(calculatePoints(true, 1000, 1000)).toBe(0);     // at limit = 0
    });

    it("handles very long time limits", () => {
      // 2 minute time limit
      const twoMinutes = 120000;
      expect(calculatePoints(true, 0, twoMinutes)).toBe(1000);           // instant = 1000
      expect(calculatePoints(true, 60000, twoMinutes)).toBe(500);        // half time = 500
      expect(calculatePoints(true, twoMinutes, twoMinutes)).toBe(0);     // at limit = 0
    });
  });
});
