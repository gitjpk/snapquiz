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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Play, Edit, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "@/components/providers/SiteSettingsProvider";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questionCount: number;
  createdAt: string;
}

interface DeleteModalState {
  isOpen: boolean;
  quiz: Quiz | null;
  confirmText: string;
  isDeleting: boolean;
}

export default function QuizzesPage() {
  const router = useRouter();
  const t = useTranslations();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingSession, setStartingSession] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    quiz: null,
    confirmText: "",
    isDeleting: false,
  });

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

  const openDeleteModal = (quiz: Quiz) => {
    setDeleteModal({
      isOpen: true,
      quiz,
      confirmText: "",
      isDeleting: false,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      quiz: null,
      confirmText: "",
      isDeleting: false,
    });
  };

  const handleDeleteQuiz = async () => {
    if (!deleteModal.quiz) return;
    if (deleteModal.confirmText !== deleteModal.quiz.title) return;

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      const res = await fetch(`/api/quizzes/${deleteModal.quiz.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setQuizzes((prev) => prev.filter((q) => q.id !== deleteModal.quiz?.id));
        closeDeleteModal();
      } else {
        alert("Failed to delete quiz");
      }
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      alert("Failed to delete quiz");
    } finally {
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
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
          <h1 className="text-3xl font-bold">{t.quizzes.title}</h1>
          <p className="text-muted-foreground">
            {t.quizzes.subtitle}
          </p>
        </div>
        <Button asChild>
          <Link href="/host/quizzes/new">
            <Plus className="mr-2 h-4 w-4" />
            {t.quizzes.createQuiz}
          </Link>
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card className="text-center">
          <CardHeader>
            <CardTitle>{t.quizzes.noQuizzes}</CardTitle>
            <CardDescription>
              {t.quizzes.createFirst}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/host/quizzes/new">
                <Plus className="mr-2 h-4 w-4" />
                {t.quizzes.createQuiz}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col relative">
              {/* Delete button */}
              <button
                onClick={() => openDeleteModal(quiz)}
                className="absolute top-3 right-3 p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                title={t.quizzes.deleteQuiz}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <CardHeader className="pr-10">
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
                    {quiz.questionCount === 1 ? t.quizzes.question : t.quizzes.questions}
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
                      {t.common.edit}
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
                    {t.quizzes.start}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.quiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDeleteModal}
          />
          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-red-600">{t.quizzes.deleteQuiz}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.quizzes.deleteAction}
            </p>
            <div className="mt-4">
              <Label htmlFor="confirm-delete" className="text-sm">
                {t.quizzes.typeToConfirm.replace("{title}", deleteModal.quiz.title)}
              </Label>
              <Input
                id="confirm-delete"
                type="text"
                value={deleteModal.confirmText}
                onChange={(e) =>
                  setDeleteModal((prev) => ({
                    ...prev,
                    confirmText: e.target.value,
                  }))
                }
                placeholder={t.quizzes.enterQuizName}
                className="mt-2"
                autoComplete="off"
              />
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={closeDeleteModal}
                disabled={deleteModal.isDeleting}
              >
                {t.common.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteQuiz}
                disabled={
                  deleteModal.confirmText !== deleteModal.quiz.title ||
                  deleteModal.isDeleting
                }
              >
                {deleteModal.isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.quizzes.deleting}
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t.quizzes.deleteQuiz}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
