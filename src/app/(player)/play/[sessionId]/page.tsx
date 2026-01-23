"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { PlayerLobby } from "@/components/game/PlayerLobby";
import { PlayerQuestion } from "@/components/game/PlayerQuestion";
import { AnswerReveal } from "@/components/game/AnswerReveal";
import { Leaderboard } from "@/components/game/Leaderboard";
import { Podium } from "@/components/game/Podium";
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
  const [error, setError] = useState<string | null>(null);

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

        if (!res.ok) {
          const data = await res.json();
          console.error("Answer submission failed:", data.message);
        }
      } catch (err) {
        console.error("Failed to submit answer:", err);
      }
    },
    [participant, currentQuestion, sessionId]
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
            <p>{error || "Something went wrong"}</p>
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
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Podium
            entries={podium}
            currentParticipantId={participant.participantId}
          />
        </div>
      </main>
    );
  }

  return null;
}
