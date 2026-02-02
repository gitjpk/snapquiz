"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AIWizard } from "@/components/quiz/AIWizard";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";

type CreationMode = "select" | "manual" | "ai";

interface QuestionForm {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  timeLimitSeconds: number;
}

export default function NewQuizPage() {
  const router = useRouter();
  const [mode, setMode] = useState<CreationMode>("select");
  const [hasLLMSettings, setHasLLMSettings] = useState(false);
  const [isCheckingSettings, setIsCheckingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for manual/after AI generation
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  // Check if LLM settings exist
  useEffect(() => {
    async function checkSettings() {
      try {
        const response = await fetch("/api/llm/settings");
        setHasLLMSettings(response.ok);
      } catch {
        setHasLLMSettings(false);
      } finally {
        setIsCheckingSettings(false);
      }
    }
    checkSettings();
  }, []);

  const handleSaveQuiz = async () => {
    if (!title.trim()) {
      setError("Please enter a quiz title");
      return;
    }

    if (questions.length === 0) {
      setError("Please add at least one question");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          questions: questions.map((q) => ({
            prompt: q.prompt,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            timeLimitSeconds: q.timeLimitSeconds,
          })),
        }),
      });

      if (response.ok) {
        const { id } = await response.json();
        router.push(`/host/quizzes/${id}`);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to save quiz");
      }
    } catch {
      setError("Failed to save quiz");
    } finally {
      setIsSaving(false);
    }
  };

  const addEmptyQuestion = () => {
    setQuestions([
      ...questions,
      {
        prompt: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        timeLimitSeconds: 30,
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: unknown) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    const newOptions = [...updated[qIndex].options];
    newOptions[optIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options: newOptions };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  if (isCheckingSettings) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/host/quizzes"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quizzes
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Create New Quiz</h1>

      {/* Mode Selection */}
      {mode === "select" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setMode("manual")}
          >
            <CardHeader>
              <CardTitle className="text-lg">Manual Creation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create questions yourself with full control over content
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-shadow hover:shadow-md ${
              !hasLLMSettings ? "opacity-75" : ""
            }`}
            onClick={() => setMode("ai")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5" />
                AI Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Generate questions from a topic using AI
              </p>
              {!hasLLMSettings && (
                <p className="mt-2 text-xs text-amber-600">
                  Requires LLM configuration in settings
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Wizard */}
      {mode === "ai" && (
        <AIWizard
          hasLLMSettings={hasLLMSettings}
          onCancel={() => setMode("select")}
          onConfigureLLM={() => router.push("/host/settings")}
        />
      )}

      {/* Manual/Edit Mode */}
      {mode === "manual" && (
        <div className="space-y-6">
          {/* Quiz Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter quiz title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the quiz"
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Questions ({questions.length})
              </h2>
              <Button variant="outline" onClick={addEmptyQuestion}>
                Add Question
              </Button>
            </div>

            {questions.map((q, qIndex) => (
              <Card key={qIndex}>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex items-start justify-between">
                    <Label>Question {qIndex + 1}</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    value={q.prompt}
                    onChange={(e) =>
                      updateQuestion(qIndex, "prompt", e.target.value)
                    }
                    placeholder="Enter question"
                  />
                  <div className="space-y-2">
                    <Label>Options (click to mark correct)</Label>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(qIndex, "correctOptionIndex", optIndex)
                          }
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                            q.correctOptionIndex === optIndex
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-muted"
                          }`}
                        >
                          {q.correctOptionIndex === optIndex ? "✓" : ""}
                        </button>
                        <Input
                          value={opt}
                          onChange={(e) =>
                            updateOption(qIndex, optIndex, e.target.value)
                          }
                          placeholder={`Option ${optIndex + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Time Limit (seconds)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={120}
                      value={q.timeLimitSeconds}
                      onChange={(e) =>
                        updateQuestion(
                          qIndex,
                          "timeLimitSeconds",
                          parseInt(e.target.value, 10) || 30
                        )
                      }
                      className="w-24"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {questions.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No questions yet. Add a question to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMode("select")}>
              Back
            </Button>
            <Button onClick={handleSaveQuiz} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Quiz"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
