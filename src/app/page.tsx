import Link from "next/link";

export default function Home() {
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
          <Link
            href="/host/quizzes"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-8 text-lg font-semibold transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Host a Quiz
          </Link>
        </div>
      </div>
    </main>
  );
}
