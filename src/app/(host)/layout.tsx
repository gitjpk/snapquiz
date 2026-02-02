import type { Metadata } from "next";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { validateSessionToken } from "@/lib/auth/session";
import { HostClientLayout } from "@/components/auth/HostClientLayout";
import { HostNav } from "@/components/layout/HostNav";

// Force dynamic rendering - this layout checks database state for auth
export const dynamic = "force-dynamic";

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
      <HostNav isAuthenticated={isAuthenticated} />
      <main>
        <HostClientLayout>{children}</HostClientLayout>
      </main>
    </div>
  );
}
