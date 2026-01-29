"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { PlayerLobby } from "@/components/game/PlayerLobby";
import { PlayerQuestion } from "@/components/game/PlayerQuestion";
import { AnswerReveal } from "@/components/game/AnswerReveal";
import { Leaderboard } from "@/components/game/Leaderboard";
import { AnimatedPodium, type PodiumParticipant } from "@/components/game/AnimatedPodium";
import { useSessionSocket } from "@/lib/realtime/client";
import {
  RealtimeEventType,
  type RealtimeEvent,
  type RealtimeQuestion,
  type AnswerDistribution,
  type LeaderboardEntry,
} from "@/lib/realtime/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

type GameState =
  | "loading"
  | "lobby"
  | "question"
  | "answered"
  | "reveal"
  | "leaderboard"
  | "ended"
  | "error";

interface ParticipantInfo {
  participantId: string;
  nickname: string;
}

interface AnswerRevealData {
  questionId: string;
  correctOptionId: string;
  distribution: AnswerDistribution[];
}

// Track points earned per question
interface QuestionResult {
  questionIndex: number;
  questionPrompt: string;
  isCorrect: boolean;
  pointsEarned: number;
  responseTimeMs: number;
  timeLimitSeconds: number;
}

export default function PlayPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();

  // Participant state
  const [participant, setParticipant] = useState<ParticipantInfo | null>(null);
  const [gameState, setGameState] = useState<GameState>("loading");
  const [_error, _setError] = useState<string | null>(null);

  // Game state
  const [participantCount, setParticipantCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] =
    useState<RealtimeQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [revealData, setRevealData] = useState<AnswerRevealData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [podium, setPodium] = useState<LeaderboardEntry[]>([]);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [answerStartTime, setAnswerStartTime] = useState<number | null>(null);
  const [_lastAnswerPoints, setLastAnswerPoints] = useState<number | null>(null);

  // Load participant from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem(`participant_${sessionId}`);
    if (!stored) {
      router.push(`/join?error=not_joined`);
      return;
    }

    try {
      const info = JSON.parse(stored) as ParticipantInfo;
      setParticipant(info);
      setGameState("lobby");
    } catch {
      router.push(`/join?error=invalid_session`);
    }
  }, [sessionId, router]);

  // Handle realtime events
  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      switch (event.type) {
        case RealtimeEventType.LOBBY_UPDATED:
          setParticipantCount(event.participantCount);
          break;

        case RealtimeEventType.QUESTION_STARTED:
          setCurrentQuestion(event.question);
          setQuestionIndex(event.questionIndex);
          setTotalQuestions(event.totalQuestions);
          setSelectedOptionId(null);
          setIsQuestionOpen(true);
          setRevealData(null);
          setAnswerStartTime(Date.now());
          setLastAnswerPoints(null);
          setGameState("question");
          break;

        case RealtimeEventType.QUESTION_CLOSED:
          setIsQuestionOpen(false);
          break;

        case RealtimeEventType.ANSWER_REVEAL:
          setRevealData({
            questionId: event.questionId,
            correctOptionId: event.correctOptionId,
            distribution: event.distribution,
          });
          setGameState("reveal");
          break;

        case RealtimeEventType.LEADERBOARD_UPDATED:
          setLeaderboard(event.entries);
          setGameState("leaderboard");
          break;

        case RealtimeEventType.GAME_ENDED:
          setPodium(event.podium);
          setGameState("ended");
          break;
      }
    },
    []
  );

  // Connect to realtime socket
  const { isConnected } = useSessionSocket(
    participant ? sessionId : null,
    handleEvent
  );

  // Handle answer submission
  const handleAnswer = useCallback(
    async (optionId: string) => {
      if (!participant || !currentQuestion) return;

      const answerTime = Date.now();
      const responseTimeMs = answerStartTime ? answerTime - answerStartTime : 0;

      setSelectedOptionId(optionId);
      setGameState("answered");

      try {
        const res = await fetch(`/api/sessions/${sessionId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId: participant.participantId,
            questionId: currentQuestion.id,
            selectedOptionId: optionId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setLastAnswerPoints(data.points || 0);
          
          // Store the result for this question
          setQuestionResults(prev => [...prev, {
            questionIndex,
            questionPrompt: currentQuestion.prompt,
            isCorrect: data.isCorrect,
            pointsEarned: data.points || 0,
            responseTimeMs,
            timeLimitSeconds: currentQuestion.timeLimitSeconds,
          }]);
        } else {
          const data = await res.json();
          console.error("Answer submission failed:", data.message);
        }
      } catch (err) {
        console.error("Failed to submit answer:", err);
      }
    },
    [participant, currentQuestion, sessionId, answerStartTime, questionIndex]
  );

  // Loading state
  if (gameState === "loading" || !participant) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p>Loading...</p>
      </main>
    );
  }

  // Error state
  if (gameState === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-sm text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{_error || "Something went wrong"}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Lobby state
  if (gameState === "lobby") {
    return (
      <main>
        <PlayerLobby
          nickname={participant.nickname}
          participantCount={participantCount}
        />
        {!isConnected && (
          <p className="text-center text-sm text-muted-foreground">
            Connecting...
          </p>
        )}
      </main>
    );
  }

  // Question or Answered state
  if (
    (gameState === "question" || gameState === "answered") &&
    currentQuestion
  ) {
    return (
      <main>
        <PlayerQuestion
          question={currentQuestion}
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
          onAnswer={handleAnswer}
          hasAnswered={gameState === "answered"}
          selectedOptionId={selectedOptionId || undefined}
          isOpen={isQuestionOpen}
        />
      </main>
    );
  }

  // Reveal state
  if (gameState === "reveal" && revealData && currentQuestion) {
    const isCorrect = selectedOptionId === revealData.correctOptionId;

    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        {/* Personal result */}
        <Card className="mb-6 max-w-sm text-center">
          <CardHeader>
            <div
              className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                isCorrect ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {isCorrect ? (
                <Check className="h-10 w-10 text-green-600" />
              ) : (
                <X className="h-10 w-10 text-red-600" />
              )}
            </div>
            <CardTitle className="text-3xl">
              {isCorrect ? "Correct!" : "Wrong!"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {isCorrect
                ? "Great job! You got it right!"
                : "Better luck on the next one!"}
            </p>
          </CardContent>
        </Card>

        {/* Answer distribution */}
        <div className="w-full max-w-2xl">
          <AnswerReveal
            prompt={currentQuestion.prompt}
            options={currentQuestion.options}
            correctOptionId={revealData.correctOptionId}
            distribution={revealData.distribution}
            selectedOptionId={selectedOptionId || undefined}
          />
        </div>
      </main>
    );
  }

  // Leaderboard state
  if (gameState === "leaderboard") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Leaderboard
            entries={leaderboard}
            currentParticipantId={participant.participantId}
            maxEntries={10}
          />
        </div>
      </main>
    );
  }

  // Game ended state
  if (gameState === "ended") {
    // Convert leaderboard entries to PodiumParticipant format
    const podiumParticipants: PodiumParticipant[] = podium.slice(0, 3).map((entry, index) => ({
      id: entry.participantId,
      name: entry.nickname,
      score: entry.pointsTotal,
      rank: (index + 1) as 1 | 2 | 3,
    }));

    // Check if current player is on podium
    const currentPlayerRank = podiumParticipants.findIndex(
      (p) => p.id === participant.participantId
    );
    const isOnPodium = currentPlayerRank !== -1;

    // Calculate total points from results
    const totalPoints = questionResults.reduce((sum, r) => sum + r.pointsEarned, 0);
    const correctAnswers = questionResults.filter(r => r.isCorrect).length;

    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <span className="text-6xl">🏆</span>
            <h2 className="mt-4 text-2xl font-bold">Final Results</h2>
            {isOnPodium && (
              <p className="text-primary mt-2">
                🎉 Congratulations! You placed #{currentPlayerRank + 1}!
              </p>
            )}
          </div>
          <AnimatedPodium
            participants={podiumParticipants}
            isPresenter={false}
            autoStart
            isMobile
          />

          {/* Score breakdown */}
          {questionResults.length > 0 && (
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Score Breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {correctAnswers}/{questionResults.length} correct • {totalPoints.toLocaleString()} points
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {questionResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      result.isCorrect 
                        ? "border-green-200 bg-green-50" 
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          result.isCorrect ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {result.isCorrect ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : (
                          <X className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Q{result.questionIndex + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          {(result.responseTimeMs / 1000).toFixed(1)}s / {result.timeLimitSeconds}s
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${result.isCorrect ? "text-green-600" : "text-red-600"}`}>
                        +{result.pointsEarned}
                      </p>
                      {result.isCorrect && (
                        <p className="text-xs text-muted-foreground">
                          {Math.round((1 - result.responseTimeMs / (result.timeLimitSeconds * 1000)) * 100)}% speed bonus
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    );
  }

  return null;
}
