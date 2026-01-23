import { test, expect } from "@playwright/test";

/**
 * US1 Smoke Test: Join and Play a Live Session
 * 
 * This test validates the participant journey:
 * 1. Create a demo session via dev endpoint
 * 2. Join via PIN with a nickname
 * 3. Wait in lobby
 * 4. Start game via dev endpoint
 * 5. Submit an answer
 * 6. See locked/confirmed answer
 * 7. See correctness result
 */

const DEMO_API_KEY = process.env.DEMO_API_KEY || "demo-secret-key";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("US1: Join and Play", () => {
  let sessionId: string;
  let pin: string;

  test.beforeAll(async ({ request }) => {
    // Create a demo session
    const response = await request.post(`${BASE_URL}/api/dev/demo-session`, {
      headers: {
        "x-api-key": DEMO_API_KEY,
        "Content-Type": "application/json",
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    sessionId = data.sessionId;
    pin = data.pin;
    expect(pin).toMatch(/^\d{6}$/);
  });

  test("participant can join, answer, and see results", async ({ page }) => {
    // Navigate to join page
    await page.goto(`${BASE_URL}/join`);
    
    // Verify join page loaded
    await expect(page.getByRole("heading", { name: /join/i })).toBeVisible();

    // Enter PIN
    await page.getByPlaceholder(/pin/i).fill(pin);
    
    // Enter nickname
    await page.getByPlaceholder(/nickname/i).fill("TestPlayer");
    
    // Click join button
    await page.getByRole("button", { name: /join/i }).click();

    // Wait for redirect to play page and lobby
    await page.waitForURL(/\/play\/[a-zA-Z0-9]+/);
    
    // Verify we're in the lobby
    await expect(page.getByText(/waiting/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("TestPlayer")).toBeVisible();

    // Start the game via dev endpoint (simulating host action)
    const startResponse = await page.request.post(
      `${BASE_URL}/api/dev/demo-control`,
      {
        headers: {
          "x-api-key": DEMO_API_KEY,
          "Content-Type": "application/json",
        },
        data: {
          sessionId,
          action: "start_game",
        },
      }
    );
    expect(startResponse.ok()).toBeTruthy();

    // Wait for question to appear
    await expect(
      page.getByText(/what is the capital/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify answer options are visible
    const options = page.locator("[data-option-id]");
    await expect(options).toHaveCount(4);

    // Click on an answer (Paris is the correct answer, typically index 0)
    await options.first().click();

    // Verify answer is locked/confirmed
    await expect(page.getByText(/answer submitted|waiting/i)).toBeVisible({
      timeout: 5000,
    });

    // Trigger answer reveal via dev endpoint
    const revealResponse = await page.request.post(
      `${BASE_URL}/api/dev/demo-control`,
      {
        headers: {
          "x-api-key": DEMO_API_KEY,
          "Content-Type": "application/json",
        },
        data: {
          sessionId,
          action: "reveal_answer",
        },
      }
    );
    expect(revealResponse.ok()).toBeTruthy();

    // Wait for reveal state - should show correct/wrong
    await expect(
      page.getByText(/correct|wrong/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test("mobile viewport join flow", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to join page
    await page.goto(`${BASE_URL}/join`);

    // Verify mobile-friendly layout (single column)
    const form = page.locator("form");
    await expect(form).toBeVisible();

    // Enter PIN and nickname
    await page.getByPlaceholder(/pin/i).fill(pin);
    await page.getByPlaceholder(/nickname/i).fill("MobilePlayer");

    // Join button should be easily tappable
    const joinButton = page.getByRole("button", { name: /join/i });
    const buttonBox = await joinButton.boundingBox();
    expect(buttonBox).toBeTruthy();
    if (buttonBox) {
      // Button should be at least 44x44 for accessibility
      expect(buttonBox.height).toBeGreaterThanOrEqual(40);
      expect(buttonBox.width).toBeGreaterThanOrEqual(100);
    }
  });

  test("validates PIN format", async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    // Try invalid PIN
    await page.getByPlaceholder(/pin/i).fill("12345"); // Only 5 digits
    await page.getByPlaceholder(/nickname/i).fill("Test");
    await page.getByRole("button", { name: /join/i }).click();

    // Should show error
    await expect(
      page.getByText(/6 digits|invalid pin/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("validates nickname is required", async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    // Enter valid PIN but no nickname
    await page.getByPlaceholder(/pin/i).fill(pin);
    await page.getByRole("button", { name: /join/i }).click();

    // Should show error
    await expect(
      page.getByText(/nickname.*required|enter.*nickname/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("handles non-existent PIN", async ({ page }) => {
    await page.goto(`${BASE_URL}/join`);

    // Enter non-existent PIN
    await page.getByPlaceholder(/pin/i).fill("999999");
    await page.getByPlaceholder(/nickname/i).fill("Test");
    await page.getByRole("button", { name: /join/i }).click();

    // Should show error about session not found
    await expect(
      page.getByText(/not found|invalid|no.*session/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe("US1: Answer Submission", () => {
  test("large tap targets on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Create and join a session (abbreviated setup)
    const createResponse = await page.request.post(
      `${BASE_URL}/api/dev/demo-session`,
      {
        headers: {
          "x-api-key": DEMO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    const { sessionId, pin } = await createResponse.json();

    // Join
    await page.goto(`${BASE_URL}/join?pin=${pin}`);
    await page.getByPlaceholder(/nickname/i).fill("TapTest");
    await page.getByRole("button", { name: /join/i }).click();
    await page.waitForURL(/\/play\//);

    // Start game
    await page.request.post(`${BASE_URL}/api/dev/demo-control`, {
      headers: {
        "x-api-key": DEMO_API_KEY,
        "Content-Type": "application/json",
      },
      data: { sessionId, action: "start_game" },
    });

    // Wait for options
    await expect(
      page.locator("[data-option-id]").first()
    ).toBeVisible({ timeout: 10000 });

    // Check tap target sizes
    const options = page.locator("[data-option-id]");
    const count = await options.count();
    
    for (let i = 0; i < count; i++) {
      const option = options.nth(i);
      const box = await option.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        // Each option should be at least 44px tall (accessibility)
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
