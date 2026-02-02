"use client";

import * as React from "react";
import { useState, useId } from "react";
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
import { useTranslations } from "@/components/providers/SiteSettingsProvider";

interface JoinFormProps {
  /** Called when form is submitted with PIN and nickname */
  onSubmit: (pin: string, nickname: string) => Promise<void>;
  /** Initial PIN value (e.g., from URL) */
  initialPin?: string;
  /** Whether the form is currently loading */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
}

export function JoinForm({
  onSubmit,
  initialPin = "",
  isLoading = false,
  error = null,
}: JoinFormProps) {
  const t = useTranslations();
  const [pin, setPin] = useState(initialPin);
  const [nickname, setNickname] = useState("");
  
  // Generate unique IDs for accessibility
  const formId = useId();
  const pinId = `${formId}-pin`;
  const nicknameId = `${formId}-nickname`;
  const errorId = `${formId}-error`;
  const pinDescId = `${formId}-pin-desc`;
  const nicknameDescId = `${formId}-nickname-desc`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || !nickname.trim()) return;
    await onSubmit(pin.trim(), nickname.trim());
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 6 characters
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(value);
  };

  const isValid = pin.length === 6 && nickname.trim().length > 0;

  return (
    <Card className="w-full max-w-sm mx-auto" role="region" aria-label="Join quiz form">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl\" id={`${formId}-title`}>
          {t.game.joinGame}
        </CardTitle>
        <CardDescription id={`${formId}-desc`}>
          {t.game.enterPin}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form 
          onSubmit={handleSubmit} 
          className="space-y-5"
          aria-labelledby={`${formId}-title`}
          aria-describedby={error ? errorId : `${formId}-desc`}
        >
          <div className="space-y-2">
            <Label htmlFor={pinId} className="text-base">{t.game.enterPin}</Label>
            <Input
              id={pinId}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="123456"
              value={pin}
              onChange={handlePinChange}
              className="h-16 text-center text-3xl tracking-[0.3em] font-mono touch-manipulation"
              maxLength={6}
              autoComplete="off"
              autoFocus={!initialPin}
              disabled={isLoading}
              aria-describedby={pinDescId}
              aria-invalid={pin.length > 0 && pin.length !== 6}
              aria-required="true"
            />
            <p id={pinDescId} className="sr-only">
              Enter the 6-digit PIN shown on the presenter screen
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={nicknameId} className="text-base">{t.game.enterNickname}</Label>
            <Input
              id={nicknameId}
              type="text"
              placeholder={t.game.enterNickname}
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 24))}
              className="h-14 text-xl touch-manipulation"
              maxLength={24}
              autoComplete="off"
              autoFocus={!!initialPin}
              disabled={isLoading}
              aria-describedby={nicknameDescId}
              aria-invalid={false}
              aria-required="true"
            />
            <p id={nicknameDescId} className="sr-only">
              Choose a nickname that will be shown to other players
            </p>
          </div>

          {error && (
            <div
              id={errorId}
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="h-14 w-full text-xl font-semibold touch-manipulation"
            disabled={!isValid || isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? t.game.joining : t.game.join}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
