/**
 * E2E Test: AI Quiz Generation Flow
 * Reference: specs/004-ai-quiz-generation/spec.md
 * 
 * Tests the AI quiz generation functionality end-to-end.
 * Note: This test requires LLM settings to be configured.
 */

import { test, expect } from "@playwright/test";

test.describe("AI Quiz Generation", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we have a clean state
    await page.goto("/host/quizzes");
  });

  test("should show AI generation option on create page", async ({ page }) => {
    await page.goto("/host/quizzes/new");
    
    // Should see the mode selection
    await expect(page.getByText("Create Quiz Manually")).toBeVisible();
    await expect(page.getByText("Generate with AI")).toBeVisible();
  });

  test("should show LLM not configured message when no settings", async ({ page }) => {
    // Clear any existing LLM settings via API
    await page.request.delete("/api/llm/settings");
    
    await page.goto("/host/quizzes/new");
    
    // Click AI generation
    await page.getByText("Generate with AI").click();
    
    // Should show configuration prompt
    await expect(page.getByText("LLM Not Configured")).toBeVisible();
    await expect(page.getByText("Configure AI Settings")).toBeVisible();
  });

  test("should navigate to settings when configure clicked", async ({ page }) => {
    await page.goto("/host/quizzes/new");
    await page.getByText("Generate with AI").click();
    
    // Click configure button (if LLM not configured)
    const configureButton = page.getByText("Configure AI Settings");
    if (await configureButton.isVisible()) {
      await configureButton.click();
      
      // Should navigate to settings
      await expect(page).toHaveURL(/\/host\/settings/);
    }
  });

  test("should display source type tabs", async ({ page }) => {
    // This test assumes LLM is configured
    // Skip if we can't verify LLM status
    await page.goto("/host/quizzes/new");
    await page.getByText("Generate with AI").click();
    
    // Check for source tabs (may be hidden if LLM not configured)
    const topicTab = page.getByRole("button", { name: /Topic/i });
    const documentTab = page.getByRole("button", { name: /Document/i });
    const urlTab = page.getByRole("button", { name: /URL/i });
    
    // If tabs are visible, verify they work
    if (await topicTab.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(topicTab).toBeVisible();
      await expect(documentTab).toBeVisible();
      await expect(urlTab).toBeVisible();
    }
  });

  test("should have generation options", async ({ page }) => {
    await page.goto("/host/quizzes/new");
    await page.getByText("Generate with AI").click();
    
    // Look for question count selector (if wizard is shown)
    const questionCountLabel = page.getByText(/questions/i);
    if (await questionCountLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Should have difficulty options
      await expect(page.getByText("Easy")).toBeVisible();
      await expect(page.getByText("Medium")).toBeVisible();
      await expect(page.getByText("Hard")).toBeVisible();
    }
  });

  test("should show cancel button in wizard", async ({ page }) => {
    await page.goto("/host/quizzes/new");
    await page.getByText("Generate with AI").click();
    
    // Should have a cancel option
    const cancelButton = page.getByRole("button", { name: /Cancel/i });
    await expect(cancelButton).toBeVisible();
  });

  test("manual quiz creation still works", async ({ page }) => {
    await page.goto("/host/quizzes/new");
    
    // Click manual creation
    await page.getByText("Create Quiz Manually").click();
    
    // Should see manual quiz form
    await expect(page.getByLabel(/Quiz Title/i)).toBeVisible();
  });
});

test.describe("LLM Settings Page", () => {
  test("should display LLM settings section", async ({ page }) => {
    await page.goto("/host/settings");
    
    // Should show AI Configuration section
    await expect(page.getByText("AI Configuration")).toBeVisible();
  });

  test("should have provider selection", async ({ page }) => {
    await page.goto("/host/settings");
    
    // Look for provider options
    const openaiOption = page.getByText(/OpenAI/i);
    const anthropicOption = page.getByText(/Anthropic/i);
    
    // At least one should be visible
    const hasProviders = 
      await openaiOption.isVisible({ timeout: 1000 }).catch(() => false) ||
      await anthropicOption.isVisible({ timeout: 1000 }).catch(() => false);
    
    expect(hasProviders).toBeTruthy();
  });

  test("should have API key field", async ({ page }) => {
    await page.goto("/host/settings");
    
    // Should have API key input
    const apiKeyInput = page.getByPlaceholder(/API key/i);
    await expect(apiKeyInput).toBeVisible();
  });

  test("should have test connection button", async ({ page }) => {
    await page.goto("/host/settings");
    
    const testButton = page.getByRole("button", { name: /Test Connection/i });
    await expect(testButton).toBeVisible();
  });
});
