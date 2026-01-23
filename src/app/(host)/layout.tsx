import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Host - SnapQuiz",
  description: "Create and host live quiz games",
};

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
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
              My Quizzes
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
