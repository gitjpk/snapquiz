/**
 * Player Simulator for Load Testing
 * 
 * Simulates multiple players joining a session and answering questions
 * via Socket.IO and HTTP API calls.
 */

import { io, Socket } from "socket.io-client";

interface SimulatedPlayer {
  id: string;
  nickname: string;
  participantId: string | null;
  socket: Socket | null;
  score: number;
  answeredQuestions: number;
}

interface QuestionEvent {
  question: {
    id: string;
    options: Array<{ id: string; label: string }>;
  };
  questionIndex: number;
  totalQuestions: number;
}

interface LoadTestConfig {
  baseUrl: string;
  sessionPin: string;
  playerCount: number;
  answerDelayMs: { min: number; max: number };
  correctAnswerProbability: number; // 0-1, chance of picking correct answer if known
}

interface LoadTestResults {
  totalPlayers: number;
  successfulJoins: number;
  failedJoins: number;
  totalAnswers: number;
  avgJoinTimeMs: number;
  avgAnswerTimeMs: number;
  errors: string[];
}

/**
 * Simulate a random delay (human-like response time)
 */
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Generate a random nickname
 */
function generateNickname(index: number): string {
  const adjectives = ["Fast", "Quick", "Smart", "Clever", "Brave", "Swift", "Keen", "Sharp"];
  const nouns = ["Tiger", "Eagle", "Hawk", "Wolf", "Bear", "Lion", "Fox", "Owl"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}${index}`;
}

/**
 * Create and manage simulated players for load testing
 */
export class PlayerSimulator {
  private config: LoadTestConfig;
  private players: SimulatedPlayer[] = [];
  private sessionId: string | null = null;
  private currentQuestion: QuestionEvent | null = null;
  private correctOptionId: string | null = null;
  private results: LoadTestResults;
  private joinTimes: number[] = [];
  private answerTimes: number[] = [];

  constructor(config: LoadTestConfig) {
    this.config = config;
    this.results = {
      totalPlayers: config.playerCount,
      successfulJoins: 0,
      failedJoins: 0,
      totalAnswers: 0,
      avgJoinTimeMs: 0,
      avgAnswerTimeMs: 0,
      errors: [],
    };
  }

  /**
   * Get session ID from PIN
   */
  private async getSessionId(): Promise<string> {
    const response = await fetch(
      `${this.config.baseUrl}/api/sessions/by-pin/${this.config.sessionPin}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.status}`);
    }
    
    const data = await response.json();
    return data.sessionId;
  }

  /**
   * Join a player to the session
   */
  private async joinPlayer(player: SimulatedPlayer): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/sessions/${this.sessionId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname: player.nickname }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Join failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      player.participantId = data.participantId;
      
      this.joinTimes.push(Date.now() - startTime);
      this.results.successfulJoins++;
      
      return true;
    } catch (error) {
      this.results.failedJoins++;
      this.results.errors.push(`Player ${player.nickname}: ${error}`);
      return false;
    }
  }

  /**
   * Connect player's socket
   */
  private connectSocket(player: SimulatedPlayer): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = io(this.config.baseUrl, {
        path: "/api/socket",
        transports: ["websocket", "polling"],
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error(`Socket connection timeout for ${player.nickname}`));
      }, 10000);

      socket.on("connect", () => {
        clearTimeout(timeout);
        socket.emit("join-session", this.sessionId);
        player.socket = socket;
        resolve();
      });

      socket.on("connect_error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      // Listen for game events
      socket.on("session-event", (event: { type: string; [key: string]: unknown }) => {
        this.handleEvent(player, event);
      });
    });
  }

  /**
   * Handle incoming game events
   */
  private handleEvent(player: SimulatedPlayer, event: { type: string; [key: string]: unknown }): void {
    switch (event.type) {
      case "question.started":
        this.currentQuestion = event as unknown as QuestionEvent;
        this.correctOptionId = null;
        // Auto-answer after random delay
        this.answerQuestion(player);
        break;
        
      case "answer.reveal":
        // Store correct answer for stats
        this.correctOptionId = (event as { correctOptionId: string }).correctOptionId;
        break;
        
      case "game.ended":
        console.log(`[${player.nickname}] Game ended. Score: ${player.score}`);
        break;
    }
  }

  /**
   * Submit an answer for a player
   */
  private async answerQuestion(player: SimulatedPlayer): Promise<void> {
    if (!this.currentQuestion || !player.participantId) return;

    // Random delay to simulate human thinking
    await randomDelay(this.config.answerDelayMs.min, this.config.answerDelayMs.max);

    const question = this.currentQuestion;
    const startTime = Date.now();

    try {
      // Pick a random answer
      const options = question.question.options;
      const randomIndex = Math.floor(Math.random() * options.length);
      const selectedOption = options[randomIndex];

      const response = await fetch(
        `${this.config.baseUrl}/api/sessions/${this.sessionId}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId: player.participantId,
            questionId: question.question.id,
            optionId: selectedOption.id,
          }),
        }
      );

      if (response.ok) {
        player.answeredQuestions++;
        this.results.totalAnswers++;
        this.answerTimes.push(Date.now() - startTime);
      } else {
        const error = await response.text();
        this.results.errors.push(`Answer failed for ${player.nickname}: ${error}`);
      }
    } catch (error) {
      this.results.errors.push(`Answer error for ${player.nickname}: ${error}`);
    }
  }

  /**
   * Initialize all players
   */
  async initialize(): Promise<void> {
    console.log(`\n🎮 Load Test: Initializing ${this.config.playerCount} players...`);
    console.log(`   Target: ${this.config.baseUrl}`);
    console.log(`   Session PIN: ${this.config.sessionPin}\n`);

    // Get session ID from PIN
    this.sessionId = await this.getSessionId();
    console.log(`📍 Session ID: ${this.sessionId}`);

    // Create player objects
    for (let i = 1; i <= this.config.playerCount; i++) {
      this.players.push({
        id: `player-${i}`,
        nickname: generateNickname(i),
        participantId: null,
        socket: null,
        score: 0,
        answeredQuestions: 0,
      });
    }
  }

  /**
   * Join all players with staggered timing
   */
  async joinAllPlayers(staggerMs: number = 100): Promise<void> {
    console.log(`\n👥 Joining ${this.players.length} players...`);
    
    const joinPromises: Promise<void>[] = [];
    
    for (const player of this.players) {
      joinPromises.push(
        (async () => {
          const joined = await this.joinPlayer(player);
          if (joined) {
            try {
              await this.connectSocket(player);
              console.log(`✓ ${player.nickname} joined`);
            } catch (err) {
              console.log(`✗ ${player.nickname} socket failed: ${err}`);
            }
          } else {
            console.log(`✗ ${player.nickname} join failed`);
          }
        })()
      );
      
      // Stagger joins to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, staggerMs));
    }

    await Promise.all(joinPromises);
    
    console.log(`\n✅ Join phase complete:`);
    console.log(`   Successful: ${this.results.successfulJoins}/${this.config.playerCount}`);
    console.log(`   Failed: ${this.results.failedJoins}`);
  }

  /**
   * Wait for game to end or timeout
   */
  async waitForGameEnd(timeoutMs: number = 300000): Promise<void> {
    console.log(`\n⏳ Waiting for game to complete (timeout: ${timeoutMs / 1000}s)...`);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log("⚠️ Game timeout reached");
        resolve();
      }, timeoutMs);

      // Check periodically if all sockets are disconnected (game ended)
      const checkInterval = setInterval(() => {
        const connectedCount = this.players.filter((p) => p.socket?.connected).length;
        if (connectedCount === 0) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
  }

  /**
   * Cleanup all connections
   */
  async cleanup(): Promise<void> {
    console.log("\n🧹 Cleaning up connections...");
    
    for (const player of this.players) {
      if (player.socket) {
        player.socket.disconnect();
      }
    }
    
    this.players = [];
  }

  /**
   * Get final results
   */
  getResults(): LoadTestResults {
    // Calculate averages
    if (this.joinTimes.length > 0) {
      this.results.avgJoinTimeMs = 
        this.joinTimes.reduce((a, b) => a + b, 0) / this.joinTimes.length;
    }
    
    if (this.answerTimes.length > 0) {
      this.results.avgAnswerTimeMs = 
        this.answerTimes.reduce((a, b) => a + b, 0) / this.answerTimes.length;
    }
    
    return this.results;
  }

  /**
   * Print results summary
   */
  printResults(): void {
    const results = this.getResults();
    
    console.log("\n" + "=".repeat(50));
    console.log("📊 LOAD TEST RESULTS");
    console.log("=".repeat(50));
    console.log(`Total Players:      ${results.totalPlayers}`);
    console.log(`Successful Joins:   ${results.successfulJoins}`);
    console.log(`Failed Joins:       ${results.failedJoins}`);
    console.log(`Total Answers:      ${results.totalAnswers}`);
    console.log(`Avg Join Time:      ${results.avgJoinTimeMs.toFixed(0)}ms`);
    console.log(`Avg Answer Time:    ${results.avgAnswerTimeMs.toFixed(0)}ms`);
    
    if (results.errors.length > 0) {
      console.log(`\n⚠️ Errors (${results.errors.length}):`);
      results.errors.slice(0, 10).forEach((err) => console.log(`   - ${err}`));
      if (results.errors.length > 10) {
        console.log(`   ... and ${results.errors.length - 10} more`);
      }
    }
    
    console.log("=".repeat(50) + "\n");
  }
}

/**
 * Run a complete load test
 */
export async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResults> {
  const simulator = new PlayerSimulator(config);
  
  try {
    await simulator.initialize();
    await simulator.joinAllPlayers(50); // 50ms between joins
    await simulator.waitForGameEnd(300000); // 5 min timeout
  } catch (error) {
    console.error("Load test error:", error);
  } finally {
    await simulator.cleanup();
    simulator.printResults();
  }
  
  return simulator.getResults();
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const baseUrl = args[0] || "http://localhost:3000";
  const sessionPin = args[1];
  const playerCount = parseInt(args[2] || "10", 10);
  
  if (!sessionPin) {
    console.error("Usage: npx tsx tests/load/player-simulator.ts <baseUrl> <sessionPin> [playerCount]");
    console.error("Example: npx tsx tests/load/player-simulator.ts http://localhost:3000 123456 30");
    process.exit(1);
  }
  
  runLoadTest({
    baseUrl,
    sessionPin,
    playerCount,
    answerDelayMs: { min: 500, max: 3000 },
    correctAnswerProbability: 0.25,
  });
}
