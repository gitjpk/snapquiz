"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface LoginFormProps {
  sessionExpired?: boolean;
}

export function LoginForm({ sessionExpired = false }: LoginFormProps) {
  const _router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!password.trim()) {
      setError("Password cannot be empty");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError("Too many login attempts. Please try again in a minute.");
        } else {
          setError(data.message || "Login failed");
        }
        return;
      }

      // Redirect to host dashboard on success
      // Use window.location for full page reload to ensure cookies are sent correctly
      window.location.href = "/host/quizzes";
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Host Login</CardTitle>
        <CardDescription>
          Enter your password to access the host area.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessionExpired && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 p-3 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">Your session has expired. Please log in again.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              aria-describedby={error ? "error-message" : undefined}
              autoFocus
            />
          </div>

          {error && (
            <p id="error-message" className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
