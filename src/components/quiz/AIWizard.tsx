"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { SourceSelector } from "./SourceSelector";
import { GenerationOptions } from "./GenerationOptions";
import { GeneratedQuestions } from "./GeneratedQuestions";
import { TokenUsageSummary } from "./TokenUsageSummary";
import type { DifficultyLevel, GeneratedQuestion, QuizLanguage } from "@/lib/llm/types";

interface GenerationSource {
  type: "topic" | "document" | "url";
  value: string;
  file?: File;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface AIWizardProps {
  onComplete: (questions: GeneratedQuestion[], title?: string) => void;
  onCancel: () => void;
  hasLLMSettings: boolean;
  onConfigureLLM: () => void;
}

type WizardStep = "source" | "generating" | "review";

export function AIWizard({
  onComplete,
  onCancel,
  hasLLMSettings,
  onConfigureLLM,
}: AIWizardProps) {
  const [step, setStep] = useState<WizardStep>("source");
  const [source, setSource] = useState<GenerationSource | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [language, setLanguage] = useState<QuizLanguage>("en");
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Show configuration prompt if LLM not set up
  if (!hasLLMSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Quiz Generation
          </CardTitle>
          <CardDescription>
            Generate quiz questions using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">LLM Not Configured</p>
              <p className="text-sm">
                Configure your AI provider in settings to use this feature.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onConfigureLLM}>
              Configure AI Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCancel = () => {
    // Cancel any in-progress request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStep("source");
    setGenerationProgress(0);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!source) return;

    setStep("generating");
    setError(null);
    setGenerationProgress(0);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Simulate progress during generation
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) return prev; // Cap at 90% until complete
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      // Handle document uploads with FormData
      if (source.type === "document" && source.file) {
        const formData = new FormData();
        formData.append("file", source.file);
        formData.append("questionCount", String(questionCount));
        formData.append("difficulty", difficulty);
        formData.append("language", language);

        const response = await fetch("/api/quizzes/generate/document", {
          method: "POST",
          body: formData,
          signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Document generation failed");
        }

        const data = await response.json();
        clearInterval(progressInterval);
        setGenerationProgress(100);
        setGeneratedQuestions(data.questions);
        setTokenUsage(data.tokenUsage);
        setWarnings(data.warnings || []);
        setStep("review");
        return;
      }

      // Handle URL generation
      if (source.type === "url") {
        const response = await fetch("/api/quizzes/generate/url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: { type: "url", value: source.value },
            questionCount,
            difficulty,
            language,
          }),
          signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "URL generation failed");
        }

        const data = await response.json();
        clearInterval(progressInterval);
        setGenerationProgress(100);
        setGeneratedQuestions(data.questions);
        setTokenUsage(data.tokenUsage);
        setWarnings(data.warnings || []);
        setStep("review");
        return;
      }

      // Handle topic with JSON
      const body: Record<string, unknown> = {
        source: {
          type: source.type,
          value: source.value,
        },
        questionCount,
        difficulty,
        language,
      };

      const response = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const data = await response.json();
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      setGeneratedQuestions(data.questions);
      setTokenUsage(data.tokenUsage);
      setWarnings(data.warnings || []);
      setStep("review");
    } catch (err) {
      clearInterval(progressInterval);
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled - don't show error
        return;
      }
      setError(err instanceof Error ? err.message : "Generation failed");
      setStep("source");
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    setError(null);
    handleGenerate();
  };

  const handleQuestionUpdate = (index: number, question: GeneratedQuestion) => {
    setGeneratedQuestions((prev) => {
      const updated = [...prev];
      updated[index] = question;
      return updated;
    });
  };

  const handleQuestionDelete = (index: number) => {
    setGeneratedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    // Generate a title from the source
    let title = "AI Generated Quiz";
    if (source?.type === "topic") {
      title = source.value.slice(0, 50) + (source.value.length > 50 ? "..." : "");
    }
    onComplete(generatedQuestions, title);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Quiz Generation
        </CardTitle>
        <CardDescription>
          {step === "source" && "Choose a source and options for your quiz"}
          {step === "generating" && "Generating questions..."}
          {step === "review" && "Review and edit generated questions"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === "source" && (
          <>
            <SourceSelector source={source} onSourceChange={setSource} />
            
            <GenerationOptions
              questionCount={questionCount}
              difficulty={difficulty}
              language={language}
              onQuestionCountChange={setQuestionCount}
              onDifficultyChange={setDifficulty}
              onLanguageChange={setLanguage}
            />

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800">Generation Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="mt-3"
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!source?.value}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Questions
              </Button>
            </div>
          </>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Generating {questionCount} questions...
            </p>
            <div className="w-full max-w-xs">
              <Progress value={generationProgress} className="h-2" />
              <p className="mt-1 text-xs text-center text-muted-foreground">
                {Math.round(generationProgress)}%
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              This may take a moment
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="mt-4"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}

        {step === "review" && (
          <>
            {warnings.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {warnings.map((warning, i) => (
                  <p key={i}>{warning}</p>
                ))}
              </div>
            )}

            {tokenUsage && <TokenUsageSummary tokenUsage={tokenUsage} />}

            <GeneratedQuestions
              questions={generatedQuestions}
              onQuestionUpdate={handleQuestionUpdate}
              onQuestionDelete={handleQuestionDelete}
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("source")}>
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={generatedQuestions.length === 0}
              >
                Use These Questions
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
