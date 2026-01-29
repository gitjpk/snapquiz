"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Edit2, Trash2, X, Check } from "lucide-react";
import type { GeneratedQuestion } from "@/lib/llm/types";

interface GeneratedQuestionsProps {
  questions: GeneratedQuestion[];
  onQuestionUpdate: (index: number, question: GeneratedQuestion) => void;
  onQuestionDelete: (index: number) => void;
}

export function GeneratedQuestions({
  questions,
  onQuestionUpdate,
  onQuestionDelete,
}: GeneratedQuestionsProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">Generated Questions ({questions.length})</Label>
      </div>

      <div className="space-y-3">
        {questions.map((question, index) => (
          <QuestionCard
            key={index}
            question={question}
            index={index}
            isEditing={editingIndex === index}
            onEdit={() => setEditingIndex(index)}
            onSave={(updated) => {
              onQuestionUpdate(index, updated);
              setEditingIndex(null);
            }}
            onCancel={() => setEditingIndex(null)}
            onDelete={() => onQuestionDelete(index)}
          />
        ))}
      </div>

      {questions.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          No questions generated
        </p>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: GeneratedQuestion;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (question: GeneratedQuestion) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function QuestionCard({
  question,
  index,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: QuestionCardProps) {
  const [editedQuestion, setEditedQuestion] = useState(question);

  const handleOptionChange = (optIndex: number, value: string) => {
    const newOptions = [...editedQuestion.options];
    newOptions[optIndex] = value;
    setEditedQuestion({ ...editedQuestion, options: newOptions });
  };

  const handleCorrectAnswerChange = (optIndex: number) => {
    setEditedQuestion({ ...editedQuestion, correctOptionIndex: optIndex });
  };

  const handleTimeLimitChange = (value: number) => {
    const clamped = Math.min(120, Math.max(10, value));
    setEditedQuestion({ ...editedQuestion, timeLimitSeconds: clamped });
  };

  if (isEditing) {
    return (
      <Card className="border-primary">
        <CardContent className="space-y-4 pt-4">
          {/* Question Text */}
          <div className="space-y-2">
            <Label>Question {index + 1}</Label>
            <Input
              value={editedQuestion.prompt}
              onChange={(e) =>
                setEditedQuestion({ ...editedQuestion, prompt: e.target.value })
              }
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Options (click to mark correct)</Label>
            {editedQuestion.options.map((option, optIndex) => (
              <div key={optIndex} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCorrectAnswerChange(optIndex)}
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    editedQuestion.correctOptionIndex === optIndex
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-muted hover:border-green-300"
                  }`}
                >
                  {editedQuestion.correctOptionIndex === optIndex && (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </button>
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                  className="flex-1"
                />
              </div>
            ))}
          </div>

          {/* Time Limit */}
          <div className="space-y-2">
            <Label>Time Limit (seconds)</Label>
            <div className="flex flex-wrap items-center gap-2">
              {[15, 20, 30, 45, 60, 90, 120].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleTimeLimitChange(preset)}
                  className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                    editedQuestion.timeLimitSeconds === preset
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-background hover:bg-accent"
                  }`}
                >
                  {preset}s
                </button>
              ))}
              <Input
                type="number"
                min={10}
                max={120}
                value={editedQuestion.timeLimitSeconds}
                onChange={(e) => handleTimeLimitChange(parseInt(e.target.value, 10) || 30)}
                className="w-20"
                placeholder="Custom"
              />
            </div>
          </div>

          {/* Explanation */}
          {editedQuestion.explanation && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="font-medium">Explanation:</span> {editedQuestion.explanation}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSave(editedQuestion)}>
              <Check className="mr-1 h-4 w-4" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <p className="font-medium">
              {index + 1}. {question.prompt}
            </p>
            <div className="space-y-1 pl-4">
              {question.options.map((option, optIndex) => (
                <div
                  key={optIndex}
                  className={`flex items-center gap-2 text-sm ${
                    optIndex === question.correctOptionIndex
                      ? "text-green-600 font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {optIndex === question.correctOptionIndex ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <span className="h-4 w-4 flex-shrink-0" />
                  )}
                  {option}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Time: {question.timeLimitSeconds}s
            </p>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
