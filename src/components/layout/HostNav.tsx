"use client";

import Link from "next/link";
import { Settings, User } from "lucide-react";
import { useTranslations } from "@/components/providers/SiteSettingsProvider";
import { LogoutButton } from "@/components/auth/LogoutButton";

interface HostNavProps {
  isAuthenticated: boolean;
  hostName?: string | null;
}

export function HostNav({ isAuthenticated, hostName }: HostNavProps) {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="text-xl font-bold text-primary">
          SnapQuiz
        </Link>
        <nav className="ml-6 flex gap-4">
          <Link
            href="/host/quizzes"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t.nav.quizzes}
          </Link>
          {isAuthenticated && (
            <Link
              href="/host/settings"
              className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              {t.nav.settings}
            </Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {isAuthenticated && hostName && (
            <Link
              href="/host/profile"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <User className="h-4 w-4" />
              {hostName}
            </Link>
          )}
          {isAuthenticated && <LogoutButton />}
        </div>
      </div>
    </header>
  );
}
