"use client";

import { useState, useEffect, useCallback, useId } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RealtimeQuestion } from "@/lib/realtime/events";

interface PlayerQuestionProps {
  /** The current question data */
  question: RealtimeQuestion;
  /** Current question index (0-based) */
  questionIndex: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Called when an answer is selected */
  onAnswer: (optionId: string) => void;
  /** Whether the question has been answered */
  hasAnswered: boolean;
  /** The selected option ID (if answered) */
  selectedOptionId?: string;
  /** Whether the question is still accepting answers */
  isOpen: boolean;
}

// Color palette for answer options (Kahoot-style)
const optionColors = [
  "bg-red-500 hover:bg-red-600 text-white focus-visible:ring-red-300",
  "bg-blue-500 hover:bg-blue-600 text-white focus-visible:ring-blue-300",
  "bg-yellow-500 hover:bg-yellow-600 text-white focus-visible:ring-yellow-300",
  "bg-green-500 hover:bg-green-600 text-white focus-visible:ring-green-300",
  "bg-purple-500 hover:bg-purple-600 text-white focus-visible:ring-purple-300",
  "bg-orange-500 hover:bg-orange-600 text-white focus-visible:ring-orange-300",
];

// Option labels for screen readers
const optionLabels = ["A", "B", "C", "D", "E", "F"];

/**
 * Interactive question view for players.
 * Displays the question, timer, and answer options with Kahoot-style colors.
 * Handles answer selection and shows feedback.
 */
export function PlayerQuestion({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  hasAnswered,
  selectedOptionId,
  isOpen,
}: PlayerQuestionProps) {
  const [timeLeft, setTimeLeft] = useState(question.timeLimitSeconds);
  const [progress, setProgress] = useState(100);
  const regionId = useId();

  // Timer countdown
  useEffect(() => {
    if (!isOpen || hasAnswered) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, hasAnswered]);

  // Progress bar update
  useEffect(() => {
    setProgress((timeLeft / question.timeLimitSeconds) * 100);
  }, [timeLeft, question.timeLimitSeconds]);

  const handleOptionClick = useCallback(
    (optionId: string) => {
      if (!isOpen || hasAnswered) return;
      onAnswer(optionId);
    },
    [isOpen, hasAnswered, onAnswer]
  );

  // Show locked state when answered
  if (hasAnswered) {
    return (
      <div 
        className="flex min-h-[70vh] flex-col items-center justify-center p-4"
        role="status"
        aria-live="polite"
      >
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl">Answer Locked In!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Wait for the reveal to see if you&apos;re correct...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="flex min-h-screen flex-col p-4"
      role="region"
      aria-label={`Question ${questionIndex + 1} of ${totalQuestions}`}
      id={regionId}
    >
      {/* Header with timer */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" aria-hidden="true">
            Question {questionIndex + 1} of {totalQuestions}
          </Badge>
          <div 
            className="flex items-center gap-2"
            role="timer"
            aria-live="off"
            aria-label={`${timeLeft} seconds remaining`}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span 
              className={cn("font-bold", timeLeft <= 5 && "text-red-500")}
              aria-hidden="true"
            >
              {timeLeft}s
            </span>
          </div>
        </div>
        <Progress 
          value={progress} 
          className="h-2" 
          aria-label={`Time remaining: ${timeLeft} seconds`}
        />
        {/* Screen reader announcement for low time */}
        {timeLeft <= 5 && timeLeft > 0 && (
          <span className="sr-only" aria-live="assertive">
            {timeLeft} seconds left
          </span>
        )}
      </div>

      {/* Question prompt (shown on player's screen for accessibility) */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <p 
            className="text-center text-lg font-medium"
            id={`${regionId}-question`}
          >
            {question.prompt}
          </p>
        </CardContent>
      </Card>

      {/* Answer options - large tap targets */}
      <div 
        className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2"
        role="group"
        aria-labelledby={`${regionId}-question`}
        aria-describedby={`${regionId}-instructions`}
      >
        <span id={`${regionId}-instructions`} className="sr-only">
          Select one answer. Options are labeled A through {optionLabels[question.options.length - 1]}.
        </span>
        {question.options.map((option, index) => (
          <Button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            disabled={!isOpen || hasAnswered}
            data-option-id={option.id}
            aria-pressed={selectedOptionId === option.id}
            aria-label={`Option ${optionLabels[index]}: ${option.label}`}
            className={cn(
              "min-h-[80px] text-lg font-semibold transition-transform active:scale-95 sm:min-h-[100px]",
              "focus-visible:ring-4 focus-visible:ring-offset-2",
              optionColors[index % optionColors.length],
              selectedOptionId === option.id && "ring-4 ring-white"
            )}
          >
            <span className="sr-only">{optionLabels[index]}:</span>
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
