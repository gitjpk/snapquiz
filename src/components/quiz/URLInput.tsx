"use client";

/**
 * URLInput Component - URL Entry for AI Quiz Generation
 * Reference: specs/004-ai-quiz-generation/spec.md (US3)
 */

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Link as LinkIcon,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface UrlValidationResult {
  valid: boolean;
  accessible?: boolean;
  title?: string;
  wordCount?: number;
  error?: string;
}

interface URLInputProps {
  value: string;
  onChange: (url: string) => void;
  onValidation: (result: UrlValidationResult | null) => void;
  disabled?: boolean;
}

export function URLInput({
  value,
  onChange,
  onValidation,
  disabled,
}: URLInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<UrlValidationResult | null>(null);

  const validateUrl = useCallback(async (url: string) => {
    if (!url) {
      setValidation(null);
      onValidation(null);
      return;
    }

    // Basic format check
    try {
      const urlObj = new URL(url);
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        const result = { valid: false, error: "Only HTTP/HTTPS URLs are supported" };
        setValidation(result);
        onValidation(result);
        return;
      }
    } catch {
      const result = { valid: false, error: "Invalid URL format" };
      setValidation(result);
      onValidation(result);
      return;
    }

    setIsValidating(true);

    try {
      // Check URL accessibility via server
      const response = await fetch("/api/quizzes/generate/url/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        const result = {
          valid: false,
          error: error.error || "Could not validate URL",
        };
        setValidation(result);
        onValidation(result);
        return;
      }

      const data = await response.json();
      const result: UrlValidationResult = {
        valid: true,
        accessible: true,
        title: data.title,
        wordCount: data.wordCount,
      };
      setValidation(result);
      onValidation(result);
    } catch {
      const result = { valid: false, error: "Failed to check URL accessibility" };
      setValidation(result);
      onValidation(result);
    } finally {
      setIsValidating(false);
    }
  }, [onValidation]);

  const handleCheck = () => {
    validateUrl(value);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://example.com/article"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              // Reset validation on change
              if (validation) {
                setValidation(null);
                onValidation(null);
              }
            }}
            className="pl-10"
            disabled={disabled || isValidating}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleCheck}
          disabled={disabled || isValidating || !value}
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Check"
          )}
        </Button>
      </div>

      {/* Validation Result */}
      {validation && (
        <Card
          className={`p-3 ${
            validation.valid
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
          }`}
        >
          <div className="flex items-start gap-3">
            {validation.valid ? (
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              {validation.valid ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-800 dark:text-green-200 truncate">
                      {validation.title || "Page accessible"}
                    </span>
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  {validation.wordCount && (
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ~{validation.wordCount.toLocaleString()} words
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Enough content for quiz generation
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-red-800 dark:text-red-200">
                  {validation.error}
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        Paste a URL to an article, blog post, or web page. We&apos;ll extract the
        content and generate quiz questions from it.
      </p>
    </div>
  );
}
