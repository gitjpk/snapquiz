import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Whether this is a presenter/host view (uses different styling) */
  isPresenter?: boolean;
  /** Additional class names for the main content area */
  className?: string;
}

export function AppShell({
  children,
  showHeader = true,
  headerContent,
  isPresenter = false,
  className,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col",
        isPresenter ? "bg-slate-900 text-white" : "bg-background"
      )}
    >
      {showHeader && (
        <header
          className={cn(
            "sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60",
            isPresenter
              ? "border-slate-700 bg-slate-900/95"
              : "border-border bg-background/95"
          )}
        >
          <div className="container mx-auto flex h-14 items-center px-4">
            {headerContent || (
              <Link
                href="/"
                className={cn(
                  "text-xl font-bold",
                  isPresenter ? "text-white" : "text-primary"
                )}
              >
                SnapQuiz
              </Link>
            )}
          </div>
        </header>
      )}

      <main
        className={cn(
          "flex-1",
          className
        )}
      >
        {children}
      </main>

      {!isPresenter && (
        <footer className="border-t py-4">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            SnapQuiz &copy; {new Date().getFullYear()}
          </div>
        </footer>
      )}
    </div>
  );
}

interface AppShellContentProps {
  children: React.ReactNode;
  /** Centers content both horizontally and vertically */
  centered?: boolean;
  /** Maximum width constraint */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

export function AppShellContent({
  children,
  centered = false,
  maxWidth = "lg",
  className,
}: AppShellContentProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn(
        "container mx-auto px-4 py-6",
        maxWidthClasses[maxWidth],
        centered && "flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center",
        className
      )}
    >
      {children}
    </div>
  );
}
