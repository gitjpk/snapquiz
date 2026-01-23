"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Edit, Loader2 } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questionCount: number;
  createdAt: string;
}

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingSession, setStartingSession] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch("/api/quizzes");
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async (quizId: string) => {
    setStartingSession(quizId);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      });

      if (res.ok) {
        const { sessionId } = await res.json();
        router.push(`/presenter/${sessionId}`);
      } else {
        alert("Failed to start session");
      }
    } catch (error) {
      console.error("Failed to start session:", error);
      alert("Failed to start session");
    } finally {
      setStartingSession(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Quizzes</h1>
          <p className="text-muted-foreground">
            Create and manage your quiz games
          </p>
        </div>
        <Button asChild>
          <Link href="/host/quizzes/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Link>
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card className="text-center">
          <CardHeader>
            <CardTitle>No quizzes yet</CardTitle>
            <CardDescription>
              Create your first quiz to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/host/quizzes/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-1">{quiz.title}</CardTitle>
                {quiz.description && (
                  <CardDescription className="line-clamp-2">
                    {quiz.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {quiz.questionCount}{" "}
                    {quiz.questionCount === 1 ? "question" : "questions"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/host/quizzes/${quiz.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStartSession(quiz.id)}
                    disabled={
                      startingSession === quiz.id || quiz.questionCount === 0
                    }
                  >
                    {startingSession === quiz.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Start
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
