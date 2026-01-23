import { describe, it, expect } from "vitest";
import {
  calculatePoints,
  calculatePointsFromTimestamps,
  MAX_POINTS,
  MIN_POINTS,
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

    it("returns min points for answer at time limit", () => {
      expect(calculatePoints(true, 20000, 20000)).toBe(MIN_POINTS);
    });

    it("returns proportional points for mid-time answer", () => {
      // At exactly half time, should be 750 (halfway between 500 and 1000)
      expect(calculatePoints(true, 10000, 20000)).toBe(750);
    });

    it("handles different time limits correctly", () => {
      // 5 second question, answered in 1 second
      // speedRatio = 1 - 1000/5000 = 0.8
      // bonus = 500 * 0.8 = 400
      // total = 500 + 400 = 900
      expect(calculatePoints(true, 1000, 5000)).toBe(900);
    });

    it("clamps negative response time to 0", () => {
      // Negative time should be treated as 0 (instant answer)
      expect(calculatePoints(true, -1000, 20000)).toBe(MAX_POINTS);
    });

    it("clamps response time exceeding limit", () => {
      // Time exceeding limit should give minimum points
      expect(calculatePoints(true, 30000, 20000)).toBe(MIN_POINTS);
    });
  });

  describe("calculatePointsFromTimestamps", () => {
    it("calculates points from Date objects", () => {
      const questionStarted = new Date("2026-01-20T10:00:00.000Z");
      const answered = new Date("2026-01-20T10:00:05.000Z"); // 5 seconds later
      const timeLimitSeconds = 20;

      // 5000ms response, 20000ms limit
      // speedRatio = 1 - 5000/20000 = 0.75
      // bonus = 500 * 0.75 = 375
      // total = 500 + 375 = 875
      const points = calculatePointsFromTimestamps(
        true,
        questionStarted,
        answered,
        timeLimitSeconds
      );

      expect(points).toBe(875);
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
      expect(calculatePoints(true, 0, 1000)).toBe(1000);
      expect(calculatePoints(true, 500, 1000)).toBe(750);
      expect(calculatePoints(true, 1000, 1000)).toBe(500);
    });

    it("handles very long time limits", () => {
      // 2 minute time limit
      const twoMinutes = 120000;
      expect(calculatePoints(true, 0, twoMinutes)).toBe(1000);
      expect(calculatePoints(true, 60000, twoMinutes)).toBe(750);
      expect(calculatePoints(true, twoMinutes, twoMinutes)).toBe(500);
    });
  });
});
