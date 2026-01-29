"use client";

import { Label } from "@/components/ui/label";
import type { DifficultyLevel, QuizLanguage } from "@/lib/llm/types";

interface GenerationOptionsProps {
  questionCount: number;
  difficulty: DifficultyLevel;
  language: QuizLanguage;
  onQuestionCountChange: (count: number) => void;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  onLanguageChange: (language: QuizLanguage) => void;
}

const QUESTION_COUNTS = [3, 5, 10, 15, 20];

const DIFFICULTIES: { value: DifficultyLevel; label: string; description: string }[] = [
  {
    value: "easy",
    label: "Easy",
    description: "Basic recall and definitions",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Understanding and application",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Analysis and evaluation",
  },
];

const LANGUAGES: { value: QuizLanguage; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
];

export function GenerationOptions({
  questionCount,
  difficulty,
  language,
  onQuestionCountChange,
  onDifficultyChange,
  onLanguageChange,
}: GenerationOptionsProps) {
  return (
    <div className="space-y-4">
      {/* Question Count */}
      <div className="space-y-2">
        <Label>Number of Questions</Label>
        <div className="flex flex-wrap gap-2">
          {QUESTION_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onQuestionCountChange(count)}
              className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                questionCount === count
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <Label>Difficulty Level</Label>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => onDifficultyChange(d.value)}
              className={`flex flex-col items-start rounded-md border px-4 py-2 text-left transition-colors ${
                difficulty === d.value
                  ? "border-primary bg-primary/10"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              <span className={`text-sm font-medium ${difficulty === d.value ? "text-primary" : ""}`}>
                {d.label}
              </span>
              <span className="text-xs text-muted-foreground">{d.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label>Quiz Language</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              type="button"
              onClick={() => onLanguageChange(lang.value)}
              className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors ${
                language === lang.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
