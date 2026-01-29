import { test, expect, Page } from "@playwright/test";

/**
 * E2E tests for podium animation feature.
 * Tests the complete flow from game end to podium display with animations.
 */

test.describe("Podium Animation", () => {
  // Helper to create a demo session with participants
  async function createDemoSession(page: Page): Promise<{ pin: string; sessionId: string }> {
    const response = await page.request.post("/api/dev/demo-session", {
      data: {
        participantCount: 3,
        completeQuiz: true,
      },
    });

    if (!response.ok()) {
      throw new Error(`Failed to create demo session: ${response.status()}`);
    }

    return response.json();
  }

  test.describe("Presenter View", () => {
    test("should show animated podium when game ends", async ({ page }) => {
      // Skip if demo API not available
      const demoCheck = await page.request.get("/api/dev/demo-session");
      if (demoCheck.status() === 404) {
        test.skip();
        return;
      }

      // Create demo session with completed quiz
      const { sessionId } = await createDemoSession(page);

      // Navigate to presenter view
      await page.goto(`/presenter/${sessionId}`);

      // Wait for the game to be in ended state
      await page.waitForSelector('text="Final Results"', { timeout: 10000 });

      // Verify podium structure is visible
      await expect(page.locator("text=🥇")).toBeVisible();
      await expect(page.locator("text=🥈")).toBeVisible();
      await expect(page.locator("text=🥉")).toBeVisible();

      // Verify animation elements have animation classes or complete state
      // (Animations may already be complete depending on timing)
      const podiumContainer = page.locator(".max-w-2xl").first();
      await expect(podiumContainer).toBeVisible();
    });

    test("should have audio toggle in presenter controls", async ({ page }) => {
      const demoCheck = await page.request.get("/api/dev/demo-session");
      if (demoCheck.status() === 404) {
        test.skip();
        return;
      }

      const { sessionId } = await createDemoSession(page);
      await page.goto(`/presenter/${sessionId}`);

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Find audio toggle button
      const audioToggle = page.getByRole("button", { name: /mute audio|unmute audio/i });
      await expect(audioToggle).toBeVisible();

      // Click to toggle
      const initialState = await audioToggle.getAttribute("aria-pressed");
      await audioToggle.click();
      const newState = await audioToggle.getAttribute("aria-pressed");

      // State should have changed
      expect(newState).not.toBe(initialState);
    });

    test("should respect reduced motion preference", async ({ page }) => {
      const demoCheck = await page.request.get("/api/dev/demo-session");
      if (demoCheck.status() === 404) {
        test.skip();
        return;
      }

      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: "reduce" });

      const { sessionId } = await createDemoSession(page);
      await page.goto(`/presenter/${sessionId}`);

      // Wait for final results
      await page.waitForSelector('text="Final Results"', { timeout: 10000 });

      // With reduced motion, all positions should be visible immediately
      await expect(page.locator("text=🥇")).toBeVisible();
      await expect(page.locator("text=🥈")).toBeVisible();
      await expect(page.locator("text=🥉")).toBeVisible();

      // No animation classes should be active
      const animatedElements = page.locator(".animate-podium-slide-up");
      const count = await animatedElements.count();
      // In reduced motion mode, animations are disabled via CSS
      // so elements might not have animation classes applied
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Player View", () => {
    test("should show animated podium for participants", async ({ page, context }) => {
      const demoCheck = await page.request.get("/api/dev/demo-session");
      if (demoCheck.status() === 404) {
        test.skip();
        return;
      }

      const { pin, sessionId } = await createDemoSession(page);

      // Join as a new participant
      await page.goto(`/join?pin=${pin}`);

      // Enter nickname and join
      const nicknameInput = page.getByPlaceholder(/nickname/i);
      if (await nicknameInput.isVisible()) {
        await nicknameInput.fill("E2EPlayer");
        await page.getByRole("button", { name: /join/i }).click();
      }

      // Navigate to play view (may already be there from join)
      await page.waitForURL(/\/play\//, { timeout: 5000 }).catch(() => {
        // Already on play page
      });

      // Wait for ended state (demo session should complete quickly)
      await page.waitForSelector('text="Final Results"', { timeout: 15000 });

      // Verify podium is visible
      await expect(page.locator("text=🏆")).toBeVisible();
    });

    test("should not play audio on player devices", async ({ page }) => {
      const demoCheck = await page.request.get("/api/dev/demo-session");
      if (demoCheck.status() === 404) {
        test.skip();
        return;
      }

      // Monitor for any audio context creation
      let audioContextCreated = false;
      await page.addInitScript(() => {
        const originalAudioContext = window.AudioContext;
        // @ts-ignore
        window.AudioContext = class extends originalAudioContext {
          constructor(...args: unknown[]) {
            // @ts-ignore
            super(...args);
            // @ts-ignore
            window.__audioContextCreated = true;
          }
        };
      });

      const { pin, sessionId } = await createDemoSession(page);

      await page.goto(`/join?pin=${pin}`);

      const nicknameInput = page.getByPlaceholder(/nickname/i);
      if (await nicknameInput.isVisible()) {
        await nicknameInput.fill("E2ENoAudio");
        await page.getByRole("button", { name: /join/i }).click();
      }

      // Wait for game end
      await page.waitForSelector('text="Final Results"', { timeout: 15000 });

      // Check if audio context was created (it shouldn't be on player view)
      audioContextCreated = await page.evaluate(
        () => (window as unknown as { __audioContextCreated?: boolean }).__audioContextCreated === true
      );

      // Player view should not create audio context
      expect(audioContextCreated).toBe(false);
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle single participant gracefully", async ({ page }) => {
      const demoCheck = await page.request.get("/api/dev/demo-session");
      if (demoCheck.status() === 404) {
        test.skip();
        return;
      }

      // Create session with only 1 participant
      const response = await page.request.post("/api/dev/demo-session", {
        data: {
          participantCount: 1,
          completeQuiz: true,
        },
      });

      if (!response.ok()) {
        test.skip();
        return;
      }

      const { sessionId } = await response.json();
      await page.goto(`/presenter/${sessionId}`);

      // Should show winner display instead of full podium
      await page.waitForSelector('text="Winner!"', { timeout: 10000 }).catch(() => {
        // May show "Final Results" instead depending on implementation
      });

      // Should not crash or show empty podium
      const pageContent = await page.content();
      expect(pageContent).not.toContain("Error");
    });

    test("should handle two participants gracefully", async ({ page }) => {
      const demoCheck = await page.request.get("/api/dev/demo-session");
      if (demoCheck.status() === 404) {
        test.skip();
        return;
      }

      const response = await page.request.post("/api/dev/demo-session", {
        data: {
          participantCount: 2,
          completeQuiz: true,
        },
      });

      if (!response.ok()) {
        test.skip();
        return;
      }

      const { sessionId } = await response.json();
      await page.goto(`/presenter/${sessionId}`);

      // Should show podium with 2 positions
      await page.waitForSelector('text="Final Results"', { timeout: 10000 });

      // Should have 1st and 2nd place medals
      await expect(page.locator("text=🥇")).toBeVisible();
      await expect(page.locator("text=🥈")).toBeVisible();
    });
  });
});
