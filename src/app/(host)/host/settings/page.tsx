import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { validateSessionToken } from "@/lib/auth/session";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { LLMSettings } from "@/components/settings/LLMSettings";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SettingsPage() {
  // Check if password exists
  const credential = await prisma.hostCredential.findFirst();
  
  if (!credential) {
    // No password set up, redirect to setup
    redirect("/setup");
  }

  // Check if authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get("host_session")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await validateSessionToken(token, credential.jwtSecret);
  if (!payload) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link 
        href="/host/quizzes" 
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quizzes
      </Link>

      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-4">AI Quiz Generation</h2>
          <LLMSettings />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Security</h2>
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}
