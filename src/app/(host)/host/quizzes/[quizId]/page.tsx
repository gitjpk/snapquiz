"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface QuestionForm {
  prompt: string;
  timeLimitSeconds: number;
  options: string[];
  correctOptionIndex: number;
}

interface QuizForm {
  title: string;
  description: string;
  questions: QuestionForm[];
}

const DEFAULT_QUESTION: QuestionForm = {
  prompt: "",
  timeLimitSeconds: 20,
  options: ["", "", "", ""],
  correctOptionIndex: 0,
};

export default function QuizEditorPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();
  const isNew = quizId === "new";

  const [form, setForm] = useState<QuizForm>({
    title: "",
    description: "",
    questions: [{ ...DEFAULT_QUESTION }],
  });
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew) {
      fetchQuiz();
    }
  }, [isNew, quizId]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          title: data.title,
          description: data.description || "",
          questions: data.questions.map((q: { prompt: string; timeLimitSeconds: number; options: { id: string; label: string }[] }, qIndex: number) => ({
            prompt: q.prompt,
            timeLimitSeconds: q.timeLimitSeconds,
            options: q.options.map((o: { label: string }) => o.label),
            correctOptionIndex: 0, // We don't have this info from the API yet
          })),
        });
      } else {
        setError("Quiz not found");
      }
    } catch {
      setError("Failed to load quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const url = isNew ? "/api/quizzes" : `/api/quizzes/${quizId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/host/quizzes");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to save quiz");
      }
    } catch {
      setError("Failed to save quiz");
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { ...DEFAULT_QUESTION }],
    }));
  };

  const removeQuestion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (index: number, updates: Partial<QuestionForm>) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, ...updates } : q
      ),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/host/quizzes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {isNew ? "Create Quiz" : "Edit Quiz"}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving || !form.title.trim()}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Quiz
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Quiz Details */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter quiz title"
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Optional description"
                maxLength={500}
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Questions</h2>
            <Badge variant="secondary">
              {form.questions.length}{" "}
              {form.questions.length === 1 ? "question" : "questions"}
            </Badge>
          </div>

          {form.questions.map((question, qIndex) => (
            <Card key={qIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Question {qIndex + 1}
                  </CardTitle>
                  {form.questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question Text *</Label>
                  <Input
                    value={question.prompt}
                    onChange={(e) =>
                      updateQuestion(qIndex, { prompt: e.target.value })
                    }
                    placeholder="Enter your question"
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time Limit (seconds)</Label>
                  <Input
                    type="number"
                    value={question.timeLimitSeconds}
                    onChange={(e) =>
                      updateQuestion(qIndex, {
                        timeLimitSeconds: Math.min(
                          120,
                          Math.max(5, parseInt(e.target.value) || 20)
                        ),
                      })
                    }
                    min={5}
                    max={120}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Answer Options (click to mark correct)</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...question.options];
                            newOptions[oIndex] = e.target.value;
                            updateQuestion(qIndex, { options: newOptions });
                          }}
                          placeholder={`Option ${oIndex + 1}`}
                          maxLength={200}
                          className={
                            question.correctOptionIndex === oIndex
                              ? "border-green-500 ring-1 ring-green-500"
                              : ""
                          }
                        />
                        <Button
                          type="button"
                          variant={
                            question.correctOptionIndex === oIndex
                              ? "default"
                              : "outline"
                          }
                          size="icon"
                          onClick={() =>
                            updateQuestion(qIndex, { correctOptionIndex: oIndex })
                          }
                          className={
                            question.correctOptionIndex === oIndex
                              ? "bg-green-500 hover:bg-green-600"
                              : ""
                          }
                        >
                          ✓
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addQuestion} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>
      </div>
    </div>
  );
}
