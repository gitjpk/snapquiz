"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2 } from "lucide-react";

interface PlayerLobbyProps {
  /** The participant's nickname */
  nickname: string;
  /** Number of participants in the lobby */
  participantCount: number;
  /** Session PIN for display */
  pin?: string;
}

export function PlayerLobby({
  nickname,
  participantCount,
  pin,
}: PlayerLobbyProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 pb-safe">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl">You&apos;re in!</CardTitle>
          {pin && (
            <p className="text-sm text-muted-foreground">
              Game PIN: <span className="font-mono font-bold text-lg">{pin}</span>
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">Playing as</p>
            <Badge variant="secondary" className="px-4 py-2 text-lg">
              {nickname}
            </Badge>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span>
              {participantCount}{" "}
              {participantCount === 1 ? "player" : "players"} joined
            </span>
          </div>

          <div className="space-y-2">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">Waiting for host to start...</p>
            <p className="text-sm text-muted-foreground">
              Look at the main screen for instructions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
