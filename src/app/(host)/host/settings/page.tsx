import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { validateSessionToken } from "@/lib/auth/session";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { LLMSettings } from "@/components/settings/LLMSettings";
import { SiteSettingsCard } from "@/components/settings/SiteSettingsCard";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";

// Force dynamic rendering - this page checks database state
export const dynamic = "force-dynamic";

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
    <SettingsPageClient>
      <SiteSettingsCard />
      <LLMSettings />
      <ChangePasswordForm />
    </SettingsPageClient>
  );
}
