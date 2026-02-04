import Link from "next/link";
import { MicrosoftLoginButton } from "@/components/auth/MicrosoftLoginButton";
import { cookies } from "next/headers";
import { validateSessionToken } from "@/lib/auth/session";

async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("host_session")?.value;
    if (!token) return false;
    
    const payload = await validateSessionToken(token);
    return !!payload;
  } catch {
    return false;
  }
}

export default async function Home() {
  const authenticated = await isAuthenticated();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold text-primary">SnapQuiz</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Interactive live quiz game for classrooms, workshops, and events.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/join"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Join a Quiz
          </Link>
          
          {authenticated ? (
            <Link
              href="/host/quizzes"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-8 text-lg font-semibold transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Host a Quiz
            </Link>
          ) : (
            <MicrosoftLoginButton 
              returnTo="/host/quizzes"
              className="h-12 text-lg"
            />
          )}
        </div>
      </div>
    </main>
  );
}
