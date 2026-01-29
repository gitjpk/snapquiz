"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Context for session expiry handling
interface SessionExpiryContextType {
  handleAuthError: (error: Response | Error) => boolean;
}

const SessionExpiryContext = createContext<SessionExpiryContextType | null>(null);

export function useSessionExpiry() {
  const context = useContext(SessionExpiryContext);
  if (!context) {
    throw new Error("useSessionExpiry must be used within SessionExpiryProvider");
  }
  return context;
}

interface SessionExpiryProviderProps {
  children: ReactNode;
}

export function SessionExpiryProvider({ children }: SessionExpiryProviderProps) {
  const router = useRouter();
  const [showReauthDialog, setShowReauthDialog] = useState(false);

  const handleAuthError = useCallback((error: Response | Error): boolean => {
    // Check if this is a 401 response indicating session expiry
    if (error instanceof Response && error.status === 401) {
      setShowReauthDialog(true);
      return true;
    }
    return false;
  }, []);

  const handleReauth = () => {
    setShowReauthDialog(false);
    router.push("/login?expired=true");
  };

  return (
    <SessionExpiryContext.Provider value={{ handleAuthError }}>
      {children}

      <Dialog open={showReauthDialog} onOpenChange={setShowReauthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Expired</DialogTitle>
            <DialogDescription>
              Your session has expired. Please log in again to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleReauth}>Log In Again</Button>
          </div>
        </DialogContent>
      </Dialog>
    </SessionExpiryContext.Provider>
  );
}

/**
 * Wrapper for fetch that automatically handles 401 errors
 * Use this for authenticated API calls in host area
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  onAuthError?: () => void
): Promise<Response> {
  const response = await fetch(input, init);

  if (response.status === 401) {
    // Session expired
    if (onAuthError) {
      onAuthError();
    }
    throw new SessionExpiredError("Session expired");
  }

  return response;
}

export class SessionExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionExpiredError";
  }
}
