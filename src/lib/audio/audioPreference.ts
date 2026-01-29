/**
 * Audio Preference Persistence
 *
 * Manages the user's audio preference (enabled/disabled) across sessions.
 * Uses localStorage for persistence.
 */

const AUDIO_PREFERENCE_KEY = "snapquiz_audio_enabled";

/**
 * Get the current audio preference from localStorage.
 * Defaults to true (enabled) if no preference is stored.
 */
export function getAudioPreference(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const stored = localStorage.getItem(AUDIO_PREFERENCE_KEY);
    if (stored === null) {
      return true; // Default to enabled
    }
    return stored === "true";
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
    return true;
  }
}

/**
 * Save the audio preference to localStorage.
 */
export function setAudioPreference(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(AUDIO_PREFERENCE_KEY, String(enabled));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear the audio preference from localStorage.
 * (Useful for testing or resetting to defaults)
 */
export function clearAudioPreference(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(AUDIO_PREFERENCE_KEY);
  } catch {
    // Ignore storage errors
  }
}
