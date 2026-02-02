"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "@/components/providers/SiteSettingsProvider";

interface SettingsPageClientProps {
  children: React.ReactNode;
}

export function SettingsPageClient({ children }: SettingsPageClientProps) {
  const t = useTranslations();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link 
        href="/host/quizzes" 
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.game.backToQuizzes}
      </Link>

      <h1 className="text-2xl font-bold mb-6">{t.settings.title}</h1>

      <div className="space-y-6">
        {Array.isArray(children) ? children.map((child, index) => (
          <section key={index}>
            {child}
          </section>
        )) : (
          <section>{children}</section>
        )}
      </div>
    </div>
  );
}
