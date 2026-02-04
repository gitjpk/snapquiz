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

interface AuthStatus {
  isAuthenticated: boolean;
  host?: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

async function getAuthStatus(): Promise<AuthStatus> {
  const cookieStore = await cookies();
  const token = cookieStore.get("host_session")?.value;
  if (!token) return { isAuthenticated: false };

  const payload = await validateSessionToken(token);
  if (!payload || !payload.jti) return { isAuthenticated: false };

  // Get session with host info
  const session = await prisma.hostSession.findUnique({
    where: { tokenId: payload.jti },
    include: { host: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return { isAuthenticated: false };
  }

  return {
    isAuthenticated: true,
    host: {
      id: session.host.id,
      email: session.host.email,
      displayName: session.host.displayName,
    },
  };
}

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, host } = await getAuthStatus();

  return (
    <div className="min-h-screen bg-background">
      <HostNav isAuthenticated={isAuthenticated} hostName={host?.displayName || host?.email} />
      <main>
        <HostClientLayout>{children}</HostClientLayout>
      </main>
    </div>
  );
}
