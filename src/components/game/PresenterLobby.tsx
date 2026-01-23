"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock } from "lucide-react";

interface Participant {
  id: string;
  nickname: string;
}

interface PresenterLobbyProps {
  pin: string;
  participantCount: number;
  participants: Participant[];
  quizTitle: string;
}

export function PresenterLobby({
  pin,
  participantCount,
  participants,
  quizTitle,
}: PresenterLobbyProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
      <Card className="w-full max-w-2xl border-slate-700 bg-slate-800 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl">{quizTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 text-center">
          {/* Join instructions */}
          <div className="space-y-4">
            <p className="text-2xl text-slate-300">Join at</p>
            <div className="rounded-lg bg-white p-4">
              <p className="text-3xl font-bold text-slate-900">snapquiz.app/join</p>
            </div>
          </div>

          {/* PIN display */}
          <div className="space-y-2">
            <p className="text-xl text-slate-300">Game PIN</p>
            <div className="rounded-lg bg-primary p-6">
              <p className="font-mono text-6xl font-bold tracking-widest">
                {pin}
              </p>
            </div>
          </div>

          {/* Participant count */}
          <div className="flex items-center justify-center gap-3 text-2xl">
            <Users className="h-8 w-8" />
            <span>
              {participantCount}{" "}
              {participantCount === 1 ? "player" : "players"} joined
            </span>
          </div>

          {/* Participant names */}
          {participants.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {participants.map((p) => (
                <span
                  key={p.id}
                  className="animate-fade-in rounded-full bg-primary/20 px-4 py-2 text-lg font-medium text-primary"
                >
                  {p.nickname}
                </span>
              ))}
            </div>
          )}

          {/* Waiting indicator */}
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Clock className="h-5 w-5 animate-pulse" />
            <span>Waiting for host to start...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
