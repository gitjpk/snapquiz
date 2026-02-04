import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateSessionToken } from "@/lib/auth/session";
import { LLMSettings } from "@/components/settings/LLMSettings";
import { SiteSettingsCard } from "@/components/settings/SiteSettingsCard";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";

// Force dynamic rendering - this page checks database state
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Check if authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get("host_session")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await validateSessionToken(token);
  if (!payload) {
    redirect("/login");
  }

  return (
    <SettingsPageClient>
      <SiteSettingsCard />
      <LLMSettings />
    </SettingsPageClient>
  );
}
