"use client";

import { useState, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAudioPreference, setAudioPreference } from "@/lib/audio/audioPreference";
import { setAudioEnabled } from "@/lib/audio/podiumAudio";

export interface AudioToggleProps {
  /**
   * Additional class name for styling
   */
  className?: string;
  /**
   * Button size variant
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Show label text alongside icon
   * @default false
   */
  showLabel?: boolean;
  /**
   * Callback when audio state changes
   */
  onChange?: (enabled: boolean) => void;
}

/**
 * Toggle button for enabling/disabling podium audio.
 * Persists preference to localStorage and syncs with audio system.
 */
export function AudioToggle({
  className,
  size = "default",
  showLabel = false,
  onChange,
}: AudioToggleProps) {
  const [isEnabled, setIsEnabled] = useState(true);

  // Load preference on mount
  useEffect(() => {
    const preference = getAudioPreference();
    setIsEnabled(preference);
    setAudioEnabled(preference);
  }, []);

  // Handle toggle
  const handleToggle = useCallback(() => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    setAudioPreference(newState);
    setAudioEnabled(newState);
    onChange?.(newState);
  }, [isEnabled, onChange]);

  const Icon = isEnabled ? Volume2 : VolumeX;

  return (
    <Button
      variant={isEnabled ? "secondary" : "outline"}
      size={size}
      className={cn(
        "gap-2 transition-all",
        !isEnabled && "opacity-70",
        className
      )}
      onClick={handleToggle}
      aria-label={isEnabled ? "Mute audio" : "Unmute audio"}
      aria-pressed={isEnabled}
    >
      <Icon
        className={cn(
          "transition-transform",
          isEnabled && "text-primary",
          size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"
        )}
      />
      {showLabel && (
        <span className={cn(size === "sm" && "text-sm")}>
          {isEnabled ? "Sound On" : "Sound Off"}
        </span>
      )}
    </Button>
  );
}

export default AudioToggle;
