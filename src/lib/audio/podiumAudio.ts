/**
 * Podium Audio Helper
 * 
 * Uses Web Audio API for precise timing and synchronized playback.
 * Handles preloading, autoplay restrictions, and graceful fallbacks.
 */

type AudioName = "drumroll" | "fanfare" | "applause";

interface AudioState {
  context: AudioContext | null;
  buffers: Map<AudioName, AudioBuffer>;
  isUnlocked: boolean;
  isEnabled: boolean;
}

const state: AudioState = {
  context: null,
  buffers: new Map(),
  isUnlocked: false,
  isEnabled: true,
};

const AUDIO_PATHS: Record<AudioName, string> = {
  drumroll: "/audio/podium/drumroll.mp3",
  fanfare: "/audio/podium/fanfare.mp3",
  applause: "/audio/podium/applause.mp3",
};

/**
 * Initialize the AudioContext (must be called after user interaction)
 */
export function initAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  
  if (!state.context) {
    try {
      state.context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch (error) {
      console.warn("[PodiumAudio] Failed to create AudioContext:", error);
      return null;
    }
  }
  
  return state.context;
}

/**
 * Unlock AudioContext after user interaction (required for autoplay policy)
 */
export async function unlockAudio(): Promise<boolean> {
  if (state.isUnlocked) return true;
  
  const context = initAudioContext();
  if (!context) return false;
  
  try {
    // Resume context if suspended
    if (context.state === "suspended") {
      await context.resume();
    }
    
    // Create and play a silent buffer to unlock
    const buffer = context.createBuffer(1, 1, 22050);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
    
    state.isUnlocked = true;
    return true;
  } catch (error) {
    console.warn("[PodiumAudio] Failed to unlock audio:", error);
    return false;
  }
}

/**
 * Preload an audio file into a buffer
 */
async function loadAudioBuffer(name: AudioName): Promise<AudioBuffer | null> {
  const context = state.context;
  if (!context) return null;
  
  // Return cached buffer if exists
  const cached = state.buffers.get(name);
  if (cached) return cached;
  
  try {
    const response = await fetch(AUDIO_PATHS[name]);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    
    state.buffers.set(name, audioBuffer);
    return audioBuffer;
  } catch (error) {
    console.warn(`[PodiumAudio] Failed to load ${name}:`, error);
    return null;
  }
}

/**
 * Preload all podium audio files
 * Call this during the leaderboard phase for instant playback
 */
export async function preloadPodiumAudio(): Promise<void> {
  initAudioContext();
  
  const loadPromises = (Object.keys(AUDIO_PATHS) as AudioName[]).map(name =>
    loadAudioBuffer(name).catch(() => null)
  );
  
  await Promise.all(loadPromises);
}

/**
 * Play an audio file
 * Returns true if playback started, false if it failed
 */
export async function playAudio(name: AudioName): Promise<boolean> {
  // Check if audio is enabled
  if (!state.isEnabled) {
    return false;
  }
  
  const context = state.context;
  if (!context) {
    console.warn("[PodiumAudio] No AudioContext available");
    return false;
  }
  
  // Ensure context is running
  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      console.warn("[PodiumAudio] Failed to resume AudioContext");
      return false;
    }
  }
  
  // Get or load the buffer
  let buffer = state.buffers.get(name);
  if (!buffer) {
    const loadedBuffer = await loadAudioBuffer(name);
    if (loadedBuffer) {
      buffer = loadedBuffer;
    }
  }
  
  if (!buffer) {
    console.warn(`[PodiumAudio] No buffer available for ${name}`);
    return false;
  }
  
  try {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
    return true;
  } catch (error) {
    console.warn(`[PodiumAudio] Failed to play ${name}:`, error);
    return false;
  }
}

/**
 * Set whether audio is enabled
 */
export function setAudioEnabled(enabled: boolean): void {
  state.isEnabled = enabled;
}

/**
 * Get whether audio is enabled
 */
export function isAudioEnabled(): boolean {
  return state.isEnabled;
}

/**
 * Stop all audio and cleanup
 */
export function stopAllAudio(): void {
  if (state.context && state.context.state !== "closed") {
    // Note: We don't close the context as it might be reused
    // Individual sounds will stop when their buffers end
  }
}

/**
 * Cleanup resources (call on unmount)
 */
export function cleanupAudio(): void {
  if (state.context && state.context.state !== "closed") {
    state.context.close().catch(() => {
      // Ignore close errors
    });
  }
  state.context = null;
  state.buffers.clear();
  state.isUnlocked = false;
}
