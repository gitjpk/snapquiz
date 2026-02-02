"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2 } from "lucide-react";
import { useTranslations } from "@/components/providers/SiteSettingsProvider";

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
  const { t } = useTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 pb-safe">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl">🎉</CardTitle>
          {pin && (
            <p className="text-sm text-muted-foreground">
              PIN: <span className="font-mono font-bold text-lg">{pin}</span>
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary" className="px-4 py-2 text-lg">
              {nickname}
            </Badge>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span>
              {participantCount} {t.game.playersJoined}
            </span>
          </div>

          <div className="space-y-2">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">{t.game.waitingForHost}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
