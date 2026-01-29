# Podium Audio Assets

This directory contains audio files for the animated podium celebration sequence.

## Overview

The podium animation plays when a quiz ends, revealing the top 3 players with sound effects and visual celebrations.

## Required Files

| File | Purpose | Plays When | Duration | Max Size |
|------|---------|------------|----------|----------|
| `drumroll.mp3` | Anticipation build-up | Before each place reveal | ~2s | 100KB |
| `fanfare.mp3` | Victory sound | 1st place reveal | ~3s | 150KB |
| `applause.mp3` | Celebration | After reveal completes | ~4s | 200KB |

## Animation Sequence

1. **Build-up** (drumroll plays)
2. **3rd place reveal** (short fanfare)
3. **2nd place reveal** (fanfare)
4. **1st place reveal** (full fanfare + confetti)
5. **Celebration** (applause)

## Sourcing Audio

For development/testing, you can use royalty-free sounds from:
- [Freesound.org](https://freesound.org) (CC0 or attribution required)
- [Pixabay](https://pixabay.com/sound-effects/) (royalty-free)
- [Mixkit](https://mixkit.co/free-sound-effects/) (free license)

Recommended search terms:
- "drumroll short suspense"
- "fanfare victory trumpet"
- "applause crowd celebration"

## Format Requirements

- **Primary format**: MP3 (universal browser support)
- **Optional WebM/Opus**: Better compression for modern browsers
- **Sample rate**: 44.1kHz or 48kHz
- **Bit rate**: 128-192kbps (good quality/size balance)
- **Channels**: Mono or stereo

## Audio API

The audio is managed by `src/lib/audio/podiumAudio.ts`:

```typescript
import { preloadPodiumAudio, playAudio, cleanupAudio } from "@/lib/audio/podiumAudio";

// Preload on component mount
preloadPodiumAudio();

// Play during animation
playAudio("drumroll");
playAudio("fanfare");
playAudio("applause");

// Cleanup on unmount
cleanupAudio();
```

## Current Status

⚠️ **Placeholder files**: The audio files in this directory are silent placeholders. Replace them with actual audio files before production deployment.

## Accessibility

Users who prefer reduced motion (`prefers-reduced-motion: reduce`) will skip the animation and audio, showing the final podium state immediately.
