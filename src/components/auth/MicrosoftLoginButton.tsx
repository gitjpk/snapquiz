"use client";

import { Button } from "@/components/ui/button";

interface MicrosoftLoginButtonProps {
  returnTo?: string;
  className?: string;
}

/**
 * Microsoft login button component
 * Redirects to /api/auth/login which initiates OAuth flow
 */
export function MicrosoftLoginButton({ returnTo, className }: MicrosoftLoginButtonProps) {
  const handleLogin = () => {
    const params = new URLSearchParams();
    if (returnTo) {
      params.set("returnTo", returnTo);
    }
    const url = `/api/auth/login${params.toString() ? `?${params.toString()}` : ""}`;
    window.location.href = url;
  };

  return (
    <Button
      onClick={handleLogin}
      className={className}
      size="lg"
      variant="outline"
    >
      <MicrosoftLogo className="mr-2 h-5 w-5" />
      Se connecter avec Microsoft
    </Button>
  );
}

/**
 * Microsoft logo SVG component
 */
function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 21 21"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}
