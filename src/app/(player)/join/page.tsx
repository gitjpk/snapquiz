"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { JoinForm } from "@/components/game/JoinForm";
import { Loader2 } from "lucide-react";

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPin = searchParams.get("pin") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (pin: string, nickname: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // First, resolve the session by PIN
        const resolveRes = await fetch(`/api/sessions/by-pin/${pin}`);

        if (!resolveRes.ok) {
          const data = await resolveRes.json();
          setError(data.message || "Invalid PIN. Please check and try again.");
          setIsLoading(false);
          return;
        }

        const { sessionId, status } = await resolveRes.json();

        if (status === "ended") {
          setError("This game has already ended.");
          setIsLoading(false);
          return;
        }

        // Join the session
        const joinRes = await fetch(`/api/sessions/${sessionId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname }),
        });

        if (!joinRes.ok) {
          const data = await joinRes.json();
          setError(data.message || "Failed to join. Please try again.");
          setIsLoading(false);
          return;
        }

        const { participantId } = await joinRes.json();

        // Store participant info in session storage
        sessionStorage.setItem(
          `participant_${sessionId}`,
          JSON.stringify({ participantId, nickname })
        );

        // Redirect to play page
        router.push(`/play/${sessionId}`);
      } catch {
        setError("Network error. Please check your connection and try again.");
        setIsLoading(false);
      }
    },
    [router]
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 pb-safe">
      <JoinForm
        onSubmit={handleSubmit}
        initialPin={initialPin}
        isLoading={isLoading}
        error={error}
      />
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}
