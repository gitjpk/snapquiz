"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { PresenterControls } from "@/components/game/PresenterControls";
import { PresenterLobby } from "@/components/game/PresenterLobby";
import { JoinQrCode } from "@/components/game/JoinQrCode";
import { AnswerReveal } from "@/components/game/AnswerReveal";
import { Leaderboard } from "@/components/game/Leaderboard";
import { Podium } from "@/components/game/Podium";
import { useSessionSocket } from "@/lib/realtime/client";
import {
  RealtimeEventType,
  type RealtimeEvent,
  type RealtimeQuestion,
  type LeaderboardEntry,
  type AnswerDistribution,
  type LobbyParticipant,
} from "@/lib/realtime/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";

type PresenterState = "loading" | "lobby" | "question" | "reveal" | "leaderboard" | "ended";

interface SessionData {
  id: string;
  pin: string;
  status: "lobby" | "in_progress" | "ended";
  quiz: {
    title: string;
    questions: { id: string }[];
  };
  participantCount: number;
}

// Color palette for answer options
const optionColors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
];

export default function PresenterPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();

  // Session state
  const [session, setSession] = useState<SessionData | null>(null);
  const [presenterState, setPresenterState] = useState<PresenterState>("loading");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState<LobbyParticipant[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<RealtimeQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [revealData, setRevealData] = useState<{
    correctOptionId: string;
    distribution: AnswerDistribution[];
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [podium, setPodium] = useState<LeaderboardEntry[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoRevealRef = useRef<boolean>(false);

  // Fetch session data
  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      
      if (res.ok) {
        const data = await res.json();
        setSession({
          id: data.id,
          pin: data.pin,
          status: data.status,
          quiz: { 
            title: data.quiz.title, 
            questions: Array(data.quiz.questionCount).fill({ id: "" }) 
          },
          participantCount: data.participantCount,
        });
        setTotalQuestions(data.quiz.questionCount);
        setParticipantCount(data.participantCount);
      }
      setPresenterState("lobby");
    } catch {
      // Continue with loading state - we'll get data from socket
      setPresenterState("lobby");
    }
  };

  // Handle realtime events from Socket.IO
  const handleEvent = useCallback((event: RealtimeEvent) => {
    switch (event.type) {
      case RealtimeEventType.LOBBY_UPDATED:
        setParticipantCount(event.participantCount);
        setParticipants(event.participants);
        break;

      case RealtimeEventType.QUESTION_STARTED:
        setCurrentQuestion(event.question);
        setQuestionIndex(event.questionIndex);
        setTotalQuestions(event.totalQuestions);
        setRevealData(null);
        setPresenterState("question");
        // Update session status to in_progress
        setSession(prev => prev ? { ...prev, status: "in_progress" } : null);
        // Start the timer
        setTimeRemaining(event.question.timeLimitSeconds);
        autoRevealRef.current = true;
        break;

      case RealtimeEventType.QUESTION_CLOSED:
        // Question is closed, waiting for reveal
        break;

      case RealtimeEventType.ANSWER_REVEAL:
        setRevealData({
          correctOptionId: event.correctOptionId,
          distribution: event.distribution,
        });
        setPresenterState("reveal");
        break;

      case RealtimeEventType.LEADERBOARD_UPDATED:
        setLeaderboard(event.entries);
        setPresenterState("leaderboard");
        break;

      case RealtimeEventType.GAME_ENDED:
        setPodium(event.podium);
        setPresenterState("ended");
        break;
    }
  }, []);

  // Connect to socket
  const { isConnected } = useSessionSocket(sessionId, handleEvent);

  // Timer effect - countdown and auto-reveal
  useEffect(() => {
    if (presenterState === "question" && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer expired - auto reveal
            if (autoRevealRef.current) {
              autoRevealRef.current = false;
              handleControl("reveal_answer");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [presenterState, timeRemaining > 0 ? 1 : 0]); // Only restart when state changes or timer starts

  // Stop timer when leaving question state
  useEffect(() => {
    if (presenterState !== "question" && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [presenterState]);

  // Host control actions
  const handleControl = async (action: string) => {
    setIsActionLoading(true);
    autoRevealRef.current = false; // Prevent auto-reveal if manually triggered
    try {
      const res = await fetch(`/api/sessions/${sessionId}/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_HOST_API_KEY || "",
        },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Action failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Loading state
  if (presenterState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join?pin=${session?.pin || ""}`
    : "";

  return (
    <div className="min-h-screen bg-slate-900 pb-24 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">SnapQuiz Presenter</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>{participantCount} players</span>
            </div>
            {!isConnected && (
              <Badge variant="destructive">Disconnected</Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-4">
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/20 p-4 text-center text-destructive">
            {error}
          </div>
        )}

        {/* Lobby */}
        {presenterState === "lobby" && session && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Waiting for Players</h2>
            </div>

            <div className="mx-auto max-w-2xl space-y-8">
              {/* Join info */}
              <div className="grid gap-8 md:grid-cols-2">
                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <CardTitle className="text-center text-white">
                      Scan to Join
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <JoinQrCode joinUrl={joinUrl} size={200} />
                  </CardContent>
                </Card>

                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <CardTitle className="text-center text-white">
                      Or enter PIN
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <div className="rounded-lg bg-primary p-4">
                      <p className="font-mono text-4xl font-bold tracking-widest">
                        {session.pin}
                      </p>
                    </div>
                    <p className="text-slate-400">at snapquiz.app/join</p>
                  </CardContent>
                </Card>
              </div>

              {/* Player count */}
              <div className="text-center">
                <div className="inline-flex items-center gap-3 rounded-full bg-slate-800 px-6 py-3">
                  <Users className="h-6 w-6" />
                  <span className="text-2xl font-bold">{participantCount}</span>
                  <span className="text-slate-400">
                    {participantCount === 1 ? "player" : "players"} joined
                  </span>
                </div>
              </div>

              {/* Participant names */}
              {participants.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {participants.map((p) => (
                    <span
                      key={p.id}
                      className="animate-pulse rounded-full bg-gradient-to-r from-primary/80 to-purple-500/80 px-5 py-2 text-lg font-semibold shadow-lg"
                    >
                      {p.nickname}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Question */}
        {presenterState === "question" && currentQuestion && (
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Timer */}
            <div className="flex justify-center">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full text-4xl font-bold ${
                timeRemaining <= 5 
                  ? "animate-pulse bg-red-600" 
                  : timeRemaining <= 10 
                    ? "bg-yellow-600" 
                    : "bg-blue-600"
              }`}>
                {timeRemaining}
              </div>
            </div>

            <div className="text-center">
              <Badge variant="secondary" className="mb-4 text-lg">
                Question {questionIndex + 1} of {totalQuestions}
              </Badge>
              <h2 className="text-4xl font-bold">{currentQuestion.prompt}</h2>
            </div>

            {currentQuestion.mediaUrl && (
              <div className="flex justify-center">
                {currentQuestion.mediaType === "image" ? (
                  <img
                    src={currentQuestion.mediaUrl}
                    alt="Question media"
                    className="max-h-64 rounded-lg"
                  />
                ) : (
                  <video
                    src={currentQuestion.mediaUrl}
                    controls
                    className="max-h-64 rounded-lg"
                  />
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={option.id}
                  className={`rounded-lg p-6 text-center text-xl font-semibold ${optionColors[index]}`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reveal */}
        {presenterState === "reveal" && currentQuestion && revealData && (
          <div className="mx-auto max-w-4xl">
            <AnswerReveal
              prompt={currentQuestion.prompt}
              options={currentQuestion.options}
              correctOptionId={revealData.correctOptionId}
              distribution={revealData.distribution}
            />
          </div>
        )}

        {/* Leaderboard */}
        {presenterState === "leaderboard" && (
          <div className="mx-auto max-w-2xl">
            <Leaderboard
              entries={leaderboard}
              maxEntries={10}
              isPresenter
            />
          </div>
        )}

        {/* Game Ended */}
        {presenterState === "ended" && (
          <div className="mx-auto max-w-2xl">
            <Podium entries={podium} isPresenter />
          </div>
        )}
      </main>

      {/* Controls */}
      <PresenterControls
        sessionStatus={session?.status || "lobby"}
        presenterState={presenterState as "lobby" | "question" | "reveal" | "leaderboard" | "ended"}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        onStartGame={() => handleControl("start_game")}
        onNextQuestion={() => handleControl("next_question")}
        onRevealAnswer={() => handleControl("reveal_answer")}
        onShowLeaderboard={() => handleControl("show_leaderboard")}
        onEndGame={() => handleControl("end_game")}
        isLoading={isActionLoading}
      />
    </div>
  );
}
