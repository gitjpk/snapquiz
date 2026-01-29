import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { validateSessionToken } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { HostClientLayout } from "@/components/auth/HostClientLayout";
import { Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Host - SnapQuiz",
  description: "Create and host live quiz games",
};

async function getAuthStatus() {
  const credential = await prisma.hostCredential.findFirst();
  if (!credential) return { isAuthenticated: false };

  const cookieStore = await cookies();
  const token = cookieStore.get("host_session")?.value;
  if (!token) return { isAuthenticated: false };

  const payload = await validateSessionToken(token, credential.jwtSecret);
  return { isAuthenticated: !!payload };
}

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = await getAuthStatus();

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
            {isAuthenticated && (
              <Link
                href="/host/settings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            )}
          </nav>
          <div className="ml-auto">
            {isAuthenticated && <LogoutButton />}
          </div>
        </div>
      </header>
      <main>
        <HostClientLayout>{children}</HostClientLayout>
      </main>
    </div>
  );
}
