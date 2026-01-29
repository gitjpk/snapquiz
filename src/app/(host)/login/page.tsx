import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { validateSessionToken } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ expired?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const sessionExpired = params.expired === "true";

  // Check if password exists
  const credential = await prisma.hostCredential.findFirst();
  
  if (!credential) {
    // No password set up, redirect to setup
    redirect("/setup");
  }

  // Check if already authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get("host_session")?.value;

  if (token) {
    const payload = await validateSessionToken(token, credential.jwtSecret);
    if (payload) {
      // Already logged in, redirect to dashboard
      redirect("/host/quizzes");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <LoginForm sessionExpired={sessionExpired} />
    </div>
  );
}
