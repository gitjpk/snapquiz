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
    <Card className="w-full max-w-sm" role="region" aria-label="Join quiz form">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl" id={`${formId}-title`}>
          Join Quiz
        </CardTitle>
        <CardDescription id={`${formId}-desc`}>
          Enter the game PIN and choose your nickname
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form 
          onSubmit={handleSubmit} 
          className="space-y-4"
          aria-labelledby={`${formId}-title`}
          aria-describedby={error ? errorId : `${formId}-desc`}
        >
          <div className="space-y-2">
            <Label htmlFor={pinId}>Game PIN</Label>
            <Input
              id={pinId}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter 6-digit PIN"
              value={pin}
              onChange={handlePinChange}
              className="h-14 text-center text-2xl tracking-widest"
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
            <Label htmlFor={nicknameId}>Nickname</Label>
            <Input
              id={nicknameId}
              type="text"
              placeholder="Your name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 24))}
              className="h-12 text-lg"
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
            className="h-12 w-full text-lg"
            disabled={!isValid || isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Joining..." : "Join Game"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
