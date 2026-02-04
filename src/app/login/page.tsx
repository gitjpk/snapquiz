"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MicrosoftLoginButton } from "@/components/auth/MicrosoftLoginButton";
import { Suspense } from "react";

/**
 * Login page with Microsoft OAuth
 * Displays error messages from OAuth callback failures
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">SnapQuiz</CardTitle>
          <CardDescription>
            Connectez-vous avec votre compte Microsoft pour accéder à votre espace formateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense fallback={<LoginButtonSkeleton />}>
            <LoginContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginButtonSkeleton() {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="h-12 w-full max-w-xs animate-pulse rounded-md bg-gray-200" />
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    cancelled: "Connexion annulée. Vous pouvez réessayer.",
    auth_failed: "L'authentification a échoué. Veuillez réessayer.",
    no_code: "Erreur de configuration OAuth. Veuillez réessayer.",
    invalid_state: "Session expirée. Veuillez réessayer.",
    not_configured: "Microsoft Entra ID n'est pas configuré. Contactez l'administrateur.",
    unavailable: "Le service de connexion est temporairement indisponible. Réessayez plus tard.",
  };

  const errorMessage = error ? errorMessages[error] || "Une erreur inattendue s'est produite." : null;

  return (
    <div className="flex flex-col items-center space-y-4">
      {errorMessage && (
        <div className="w-full rounded-md bg-red-50 p-3 text-center text-sm text-red-600">
          {errorMessage}
        </div>
      )}
      
      <MicrosoftLoginButton className="w-full max-w-xs" />
      
      <p className="text-center text-xs text-gray-500">
        En vous connectant, vous acceptez nos conditions d&apos;utilisation
      </p>
    </div>
  );
}
