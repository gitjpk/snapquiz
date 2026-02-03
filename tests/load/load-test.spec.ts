/**
 * Load Test: Full Game with Simulated Players
 * 
 * This test uses Playwright to control the presenter view
 * while simultaneously spawning simulated players via the PlayerSimulator.
 * 
 * Usage:
 *   npx playwright test tests/load/load-test.spec.ts
 * 
 * Environment variables:
 *   LOAD_TEST_URL - Target URL (default: http://localhost:3000)
 *   LOAD_TEST_PLAYERS - Number of simulated players (default: 30)
 */

import { test, expect } from "@playwright/test";
import { PlayerSimulator, type LoadTestResults } from "./player-simulator";

// Configuration
const BASE_URL = process.env.LOAD_TEST_URL || "http://localhost:3000";
const PLAYER_COUNT = parseInt(process.env.LOAD_TEST_PLAYERS || "30", 10);
const QUESTION_WAIT_TIME = 8000; // Time to wait for answers before advancing

interface GameMetrics {
  sessionPin: string;
  playerResults: LoadTestResults;
  questionTimes: number[];
  totalGameTimeMs: number;
}

test.describe("Load Testing", () => {
  test.setTimeout(600000); // 10 minute timeout for load tests

  test("Full game with simulated players", async ({ page, context }) => {
    const metrics: Partial<GameMetrics> = {
      questionTimes: [],
    };
    const gameStartTime = Date.now();

    // Step 1: Login as host
    console.log("\n🔐 Logging in as host...");
    await page.goto(`${BASE_URL}/host/quizzes`);
    
    // Handle login if needed
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill("test");
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/host\/quizzes/, { timeout: 10000 });
    }
    
    // Wait for page to be ready
    await page.waitForLoadState("networkidle");

    // Step 2: Create a test quiz via API using the browser context (with cookies)
    console.log("📝 Creating test quiz...");
    const quizResponse = await context.request.post(`${BASE_URL}/api/quizzes`, {
      data: {
        title: `Load Test Quiz - ${PLAYER_COUNT} players`,
        questions: [
          {
            prompt: "What is 2 + 2?",
            options: [
              { label: "3", isCorrect: false },
              { label: "4", isCorrect: true },
              { label: "5", isCorrect: false },
              { label: "6", isCorrect: false },
            ],
            timeLimitSeconds: 20,
          },
          {
            prompt: "What is the capital of France?",
            options: [
              { label: "London", isCorrect: false },
              { label: "Berlin", isCorrect: false },
              { label: "Paris", isCorrect: true },
              { label: "Madrid", isCorrect: false },
            ],
            timeLimitSeconds: 20,
          },
          {
            prompt: "Which planet is closest to the Sun?",
            options: [
              { label: "Venus", isCorrect: false },
              { label: "Mercury", isCorrect: true },
              { label: "Earth", isCorrect: false },
              { label: "Mars", isCorrect: false },
            ],
            timeLimitSeconds: 20,
          },
          {
            prompt: "What is the largest mammal?",
            options: [
              { label: "Elephant", isCorrect: false },
              { label: "Blue Whale", isCorrect: true },
              { label: "Giraffe", isCorrect: false },
              { label: "Hippopotamus", isCorrect: false },
            ],
            timeLimitSeconds: 20,
          },
          {
            prompt: "How many continents are there?",
            options: [
              { label: "5", isCorrect: false },
              { label: "6", isCorrect: false },
              { label: "7", isCorrect: true },
              { label: "8", isCorrect: false },
            ],
            timeLimitSeconds: 20,
          },
        ],
      },
    });

    expect(quizResponse.ok()).toBeTruthy();
    const quiz = await quizResponse.json();
    console.log(`   Quiz created: ${quiz.id}`);

    // Step 3: Start a session
    console.log("🎮 Starting game session...");
    const sessionResponse = await context.request.post(`${BASE_URL}/api/sessions`, {
      data: { quizId: quiz.id },
    });

    expect(sessionResponse.ok()).toBeTruthy();
    const session = await sessionResponse.json();
    metrics.sessionPin = session.pin;
    console.log(`   Session PIN: ${session.pin}`);

    // Step 4: Go to presenter view
    await page.goto(`${BASE_URL}/presenter/${session.id}`);
    await expect(page.locator("text=PIN")).toBeVisible({ timeout: 5000 });

    // Step 5: Start simulated players
    console.log(`\n🤖 Starting ${PLAYER_COUNT} simulated players...`);
    const simulator = new PlayerSimulator({
      baseUrl: BASE_URL,
      sessionPin: session.pin,
      playerCount: PLAYER_COUNT,
      answerDelayMs: { min: 1000, max: 5000 },
      correctAnswerProbability: 0.25,
    });

    await simulator.initialize();
    await simulator.joinAllPlayers(100); // 100ms between joins

    // Wait for players to show up in presenter view
    await page.waitForTimeout(2000);
    
    // Verify players joined
    const playerCountText = await page.locator('[data-testid="player-count"], .text-4xl, h2').first().textContent();
    console.log(`   Presenter shows: ${playerCountText}`);

    // Step 6: Start the game
    console.log("\n▶️ Starting the game...");
    await page.click('button:has-text("Start"), button:has-text("Commencer")');

    // Step 7: Run through questions
    const totalQuestions = 5;
    
    for (let q = 1; q <= totalQuestions; q++) {
      const questionStartTime = Date.now();
      console.log(`\n📋 Question ${q}/${totalQuestions}`);

      // Wait for question to be displayed
      await page.waitForSelector('[data-testid="question-prompt"], .text-2xl, h2', { timeout: 10000 });
      
      // Wait for players to answer (auto-reveal should trigger, or we wait)
      console.log(`   Waiting for answers...`);
      await page.waitForTimeout(QUESTION_WAIT_TIME);

      // Check if we need to manually reveal (if auto-reveal didn't trigger)
      const revealButton = page.locator('button:has-text("Reveal"), button:has-text("Révéler")');
      if (await revealButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await revealButton.click();
        await page.waitForTimeout(1000);
      }

      // Wait for answer reveal screen
      await page.waitForTimeout(2000);
      
      // Show leaderboard
      const leaderboardButton = page.locator('button:has-text("Leaderboard"), button:has-text("Classement")');
      if (await leaderboardButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await leaderboardButton.click();
        await page.waitForTimeout(2000);
      }

      metrics.questionTimes!.push(Date.now() - questionStartTime);

      // Move to next question if not last
      if (q < totalQuestions) {
        const nextButton = page.locator('button:has-text("Next"), button:has-text("Suivant")');
        if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextButton.click();
        }
      }
    }

    // Step 8: End game
    console.log("\n🏁 Ending game...");
    const endButton = page.locator('button:has-text("End"), button:has-text("Terminer"), button:has-text("Finish")');
    if (await endButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await endButton.click();
    }

    // Wait for podium
    await page.waitForTimeout(3000);

    // Cleanup
    metrics.playerResults = simulator.getResults();
    await simulator.cleanup();

    metrics.totalGameTimeMs = Date.now() - gameStartTime;

    // Print final metrics
    printMetrics(metrics as GameMetrics);

    // Assertions
    expect(metrics.playerResults!.successfulJoins).toBeGreaterThan(PLAYER_COUNT * 0.9); // 90%+ success rate
    expect(metrics.playerResults!.totalAnswers).toBeGreaterThan(0);
  });

  test("Stress test: rapid player joins", async ({ page, context }) => {
    console.log("\n🔥 Stress Test: Rapid Player Joins");
    
    // Login
    await page.goto(`${BASE_URL}/host/quizzes`);
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill("test");
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/host\/quizzes/, { timeout: 10000 });
    }
    await page.waitForLoadState("networkidle");

    // Create session
    const quizResponse = await context.request.post(`${BASE_URL}/api/quizzes`, {
      data: {
        title: "Stress Test Quiz",
        questions: [
          {
            prompt: "Test question",
            options: [
              { label: "A", isCorrect: true },
              { label: "B", isCorrect: false },
            ],
            timeLimitSeconds: 30,
          },
        ],
      },
    });
    const quiz = await quizResponse.json();

    const sessionResponse = await context.request.post(`${BASE_URL}/api/sessions`, {
      data: { quizId: quiz.id },
    });
    const session = await sessionResponse.json();

    // Rapid joins - no stagger
    console.log(`   Session PIN: ${session.pin}`);
    console.log(`   Joining ${PLAYER_COUNT} players simultaneously...`);
    
    const joinStartTime = Date.now();
    const simulator = new PlayerSimulator({
      baseUrl: BASE_URL,
      sessionPin: session.pin,
      playerCount: PLAYER_COUNT,
      answerDelayMs: { min: 100, max: 500 },
      correctAnswerProbability: 0.25,
    });

    await simulator.initialize();
    await simulator.joinAllPlayers(10); // Very fast - only 10ms between joins

    const joinDuration = Date.now() - joinStartTime;
    const results = simulator.getResults();

    console.log(`\n📊 Stress Test Results:`);
    console.log(`   Total join time: ${joinDuration}ms`);
    console.log(`   Success rate: ${((results.successfulJoins / PLAYER_COUNT) * 100).toFixed(1)}%`);
    console.log(`   Avg join time: ${results.avgJoinTimeMs.toFixed(0)}ms`);

    await simulator.cleanup();

    // At least 80% should succeed even under stress
    expect(results.successfulJoins).toBeGreaterThan(PLAYER_COUNT * 0.8);
  });
});

function printMetrics(metrics: GameMetrics): void {
  console.log("\n" + "=".repeat(60));
  console.log("📊 FULL GAME LOAD TEST RESULTS");
  console.log("=".repeat(60));
  console.log(`Session PIN:          ${metrics.sessionPin}`);
  console.log(`Total Game Time:      ${(metrics.totalGameTimeMs / 1000).toFixed(1)}s`);
  console.log(`\nPlayer Metrics:`);
  console.log(`  Successful Joins:   ${metrics.playerResults.successfulJoins}/${metrics.playerResults.totalPlayers}`);
  console.log(`  Total Answers:      ${metrics.playerResults.totalAnswers}`);
  console.log(`  Avg Join Time:      ${metrics.playerResults.avgJoinTimeMs.toFixed(0)}ms`);
  console.log(`  Avg Answer Time:    ${metrics.playerResults.avgAnswerTimeMs.toFixed(0)}ms`);
  console.log(`\nQuestion Times:`);
  metrics.questionTimes.forEach((time, i) => {
    console.log(`  Q${i + 1}: ${(time / 1000).toFixed(1)}s`);
  });
  
  if (metrics.playerResults.errors.length > 0) {
    console.log(`\n⚠️ Errors: ${metrics.playerResults.errors.length}`);
  }
  
  console.log("=".repeat(60) + "\n");
}
