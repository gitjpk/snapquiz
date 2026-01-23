import { describe, it, expect } from "vitest";
import {
  generateRandomPin,
  isConfusingPattern,
  isValidPinFormat,
} from "@/lib/sessions/pin";

describe("PIN Generation", () => {
  describe("generateRandomPin", () => {
    it("generates a 6-digit string", () => {
      const pin = generateRandomPin();
      expect(pin).toMatch(/^\d{6}$/);
    });

    it("generates different PINs on multiple calls", () => {
      const pins = new Set<string>();
      for (let i = 0; i < 100; i++) {
        pins.add(generateRandomPin());
      }
      // Should have high uniqueness (allow some collisions)
      expect(pins.size).toBeGreaterThan(90);
    });

    it("does not generate confusing patterns", () => {
      for (let i = 0; i < 100; i++) {
        const pin = generateRandomPin();
        expect(isConfusingPattern(pin)).toBe(false);
      }
    });
  });

  describe("isConfusingPattern", () => {
    it("detects all-same-digit patterns", () => {
      expect(isConfusingPattern("111111")).toBe(true);
      expect(isConfusingPattern("222222")).toBe(true);
      expect(isConfusingPattern("000000")).toBe(true);
      expect(isConfusingPattern("999999")).toBe(true);
    });

    it("detects sequential ascending patterns", () => {
      expect(isConfusingPattern("123456")).toBe(true);
      expect(isConfusingPattern("234567")).toBe(true);
      expect(isConfusingPattern("345678")).toBe(true);
    });

    it("detects sequential descending patterns", () => {
      expect(isConfusingPattern("654321")).toBe(true);
      expect(isConfusingPattern("765432")).toBe(true);
    });

    it("allows normal patterns", () => {
      expect(isConfusingPattern("482915")).toBe(false);
      expect(isConfusingPattern("739284")).toBe(false);
      expect(isConfusingPattern("192837")).toBe(false);
    });
  });

  describe("isValidPinFormat", () => {
    it("accepts valid 6-digit PINs", () => {
      expect(isValidPinFormat("123456")).toBe(true);
      expect(isValidPinFormat("000001")).toBe(true);
      expect(isValidPinFormat("999999")).toBe(true);
    });

    it("rejects invalid formats", () => {
      expect(isValidPinFormat("12345")).toBe(false); // too short
      expect(isValidPinFormat("1234567")).toBe(false); // too long
      expect(isValidPinFormat("12345a")).toBe(false); // contains letter
      expect(isValidPinFormat("12 345")).toBe(false); // contains space
      expect(isValidPinFormat("")).toBe(false); // empty
    });
  });
});
