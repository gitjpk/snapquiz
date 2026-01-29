import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { SetupForm } from "@/components/auth/SetupForm";

export default async function SetupPage() {
  // Check if password already exists
  const credential = await prisma.hostCredential.findFirst();
  
  if (credential) {
    // Password already set up, redirect to login
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <SetupForm />
    </div>
  );
}
