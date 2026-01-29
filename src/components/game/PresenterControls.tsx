"use client";

import { Button } from "@/components/ui/button";
import { Play, SkipForward, Eye, Trophy, Square, Loader2 } from "lucide-react";
import { AudioToggle } from "./AudioToggle";

type SessionStatus = "lobby" | "in_progress" | "ended";
type PresenterState = "lobby" | "question" | "reveal" | "leaderboard" | "ended";

interface PresenterControlsProps {
  /** Current session status from database */
  sessionStatus: SessionStatus;
  /** Current presenter view state */
  presenterState: PresenterState;
  /** Current question index (0-based) */
  questionIndex: number;
  /** Total number of questions in quiz */
  totalQuestions: number;
  /** Handler to start the game */
  onStartGame: () => void;
  /** Handler to advance to next question */
  onNextQuestion: () => void;
  /** Handler to reveal the correct answer */
  onRevealAnswer: () => void;
  /** Handler to show current leaderboard */
  onShowLeaderboard: () => void;
  /** Handler to end the game */
  onEndGame: () => void;
  /** Whether an action is in progress */
  isLoading: boolean;
}

/**
 * Fixed bottom control bar for the presenter view.
 * Shows contextual buttons based on game state.
 */
export function PresenterControls({
  sessionStatus,
  presenterState,
  questionIndex,
  totalQuestions,
  onStartGame,
  onNextQuestion,
  onRevealAnswer,
  onShowLeaderboard,
  onEndGame,
  isLoading,
}: PresenterControlsProps) {
  const isLastQuestion = questionIndex >= totalQuestions - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-slate-700 bg-slate-900/95 p-4 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left: Audio toggle */}
        <div className="flex items-center">
          <AudioToggle size="default" />
        </div>

        {/* Center: Main controls */}
        <div className="flex items-center justify-center gap-4">
        {isLoading && (
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        )}

        {/* Lobby: Start button */}
        {sessionStatus === "lobby" && (
          <Button
            size="lg"
            onClick={onStartGame}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="mr-2 h-5 w-5" />
            Start Game
          </Button>
        )}

        {/* Question active: Reveal button */}
        {sessionStatus === "in_progress" && presenterState === "question" && (
          <Button
            size="lg"
            onClick={onRevealAnswer}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Eye className="mr-2 h-5 w-5" />
            Reveal Answer
          </Button>
        )}

        {/* Answer revealed: Show Leaderboard AND Next Question buttons */}
        {sessionStatus === "in_progress" && presenterState === "reveal" && (
          <div className="flex gap-4">
            <Button
              size="lg"
              onClick={onShowLeaderboard}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Show Leaderboard
            </Button>
            {!isLastQuestion ? (
              <Button
                size="lg"
                onClick={onNextQuestion}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <SkipForward className="mr-2 h-5 w-5" />
                Next Question
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={onEndGame}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Square className="mr-2 h-5 w-5" />
                End Game
              </Button>
            )}
          </div>
        )}

        {/* Leaderboard shown: Next question or End game */}
        {sessionStatus === "in_progress" && presenterState === "leaderboard" && (
          <>
            {!isLastQuestion ? (
              <Button
                size="lg"
                onClick={onNextQuestion}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <SkipForward className="mr-2 h-5 w-5" />
                Next Question
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={onEndGame}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Square className="mr-2 h-5 w-5" />
                End Game
              </Button>
            )}
          </>
        )}

        {/* Game ended */}
        {presenterState === "ended" && (
          <span className="text-lg font-semibold text-white">
            🎉 Game Complete!
          </span>
        )}
        </div>

        {/* Right: Spacer to balance layout */}
        <div className="w-[100px]" />
      </div>
    </div>
  );
}
