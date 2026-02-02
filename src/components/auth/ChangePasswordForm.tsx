"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "@/components/providers/SiteSettingsProvider";

export function ChangePasswordForm() {
  const t = useTranslations();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (!currentPassword.trim()) {
      setError(t.auth.currentPasswordRequired);
      return;
    }

    if (!newPassword.trim()) {
      setError(t.auth.newPasswordEmpty);
      return;
    }

    if (newPassword.length < 8) {
      setError(t.auth.newPasswordMinLength);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError(t.auth.newPasswordsMismatch);
      return;
    }

    if (currentPassword === newPassword) {
      setError(t.auth.newPasswordMustDiffer);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to change password");
        return;
      }

      // Clear form and show success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccess(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t.auth.changePassword}</CardTitle>
        <CardDescription>
          {t.auth.changePasswordDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-800 dark:bg-green-950 dark:text-green-200">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{t.auth.passwordChanged}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t.auth.currentPassword}</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t.auth.enterCurrentPassword}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t.auth.newPassword}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t.auth.enterNewPassword}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">{t.auth.confirmNewPassword}</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder={t.auth.confirmNewPasswordPlaceholder}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t.auth.changingPassword : t.auth.changePassword}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
