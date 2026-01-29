# Quickstart: Podium Animations Development

## Prerequisites

- Node.js 20 LTS
- Existing SnapQuiz setup from feature 001 (live quiz game)
- Audio files in `public/audio/podium/` (see Audio Assets section below)

## Setup

```bash
# 1. Install new dependency for confetti
npm install canvas-confetti

# 2. Install type definitions
npm install -D @types/canvas-confetti

# 3. Create audio directory
mkdir -p public/audio/podium

# 4. Add audio files (see Audio Assets section below)
```

## Audio Assets

### Required Files

Place these files in `public/audio/podium/`:

| File | Purpose | Recommended Duration |
|------|---------|---------------------|
| `drumroll.mp3` | Plays during reveal anticipation | 3-4 seconds |
| `fanfare.mp3` | Plays when 1st place is revealed | 2-3 seconds |
| `applause.mp3` | Plays during celebration phase | 4-5 seconds |

### Audio Format Requirements

- **Format**: MP3 (best browser compatibility) or WebM/OGG as fallback
- **Sample Rate**: 44.1kHz recommended
- **Bit Rate**: 128-192 kbps (balance quality vs file size)
- **File Size**: Keep each file under 200KB for fast loading

### Royalty-Free Audio Sources

For development/testing, you can use royalty-free sounds from:

- [Freesound.org](https://freesound.org) - CC0 or attribution required
- [Pixabay](https://pixabay.com/sound-effects/) - royalty-free, no attribution
- [Mixkit](https://mixkit.co/free-sound-effects/) - royalty-free

**Recommended search terms:**
- Drumroll: "drumroll short", "snare roll", "anticipation drum"
- Fanfare: "fanfare victory", "trumpet triumph", "winner announcement"
- Applause: "applause celebration", "crowd cheering", "audience clapping"

### Audio Optimization Tips

```bash
# Convert to MP3 with ffmpeg (if needed)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 192k output.mp3

# Trim to specific duration
ffmpeg -i input.mp3 -t 3 -acodec copy trimmed.mp3

# Normalize audio levels
ffmpeg -i input.mp3 -af "loudnorm=I=-16:TP=-1.5:LRA=11" normalized.mp3
```

## Development Workflow

### 1. Run the dev server

```bash
npm run dev
```

Server starts at http://localhost:3000

### 2. Test podium animations

1. Create a demo session: `POST http://localhost:3000/api/dev/demo-session`
2. Join with 2+ participants via `/join`
3. Run through quiz questions via dev controls
4. Trigger game end to see podium animations

### 3. Test reduced motion

In Chrome DevTools:
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Type "Reduce motion"
3. Select "Emulate CSS prefers-reduced-motion: reduce"
4. Trigger podium - should skip to final state immediately

### 4. Test audio toggle

1. Open presenter view `/presenter/[sessionId]`
2. Look for audio toggle (🔊/🔇 icon) in bottom control bar
3. Toggle off, trigger podium - no sound should play
4. Toggle on, trigger podium - sounds should play
5. Preference persists across page reloads (stored in localStorage)

## Key Files

| File | Purpose |
|------|---------|
| `src/components/game/AnimatedPodium.tsx` | Main animated podium component |
| `src/components/game/ConfettiEffect.tsx` | Confetti celebration effect |
| `src/components/game/AudioToggle.tsx` | Audio mute/unmute control |
| `src/lib/audio/podiumAudio.ts` | Web Audio API helper |
| `src/lib/audio/audioPreference.ts` | Audio preference persistence |
| `src/lib/types/podium.ts` | Animation phases & timing constants |
| `src/hooks/usePodiumAnimation.ts` | Animation state machine hook |
| `src/hooks/useReducedMotion.ts` | Reduced motion detection hook |
| `src/app/globals.css` | CSS keyframe animations |

## Testing

```bash
# Unit tests for animation state machine
npm run test -- --grep "podiumAnimation"

# E2E test for podium flow
npm run test:e2e -- --grep "podium"
```

## Troubleshooting

### Audio doesn't play

1. **Check console**: Look for "PodiumAudio" warnings
2. **Autoplay policy**: User must interact with page first (click anywhere)
3. **Verify files**: Ensure audio files exist in `public/audio/podium/`
4. **Audio toggle**: Check if audio is muted (toggle button in controls)
5. **Network tab**: Verify audio files load with 200 status

### Animations are choppy on mobile

1. **Reduced motion**: Check if device has "reduce motion" enabled in accessibility settings
2. **Lower particle count**: Mobile devices get 50% fewer confetti particles automatically
3. **Test mid-range devices**: Don't only test on high-end phones
4. **Check DevTools**: Use Performance panel to identify render bottlenecks

### Animations don't play at all

1. **Check phase state**: Animation may be stuck in "idle" phase
2. **Auto-start**: Verify `autoStart={true}` is passed to AnimatedPodium
3. **Participant data**: Ensure participants array has valid entries
4. **Console errors**: Check for any JavaScript errors

### Confetti not showing

1. Verify canvas-confetti is installed: `npm ls canvas-confetti`
2. Check console for import errors
3. Ensure component is client-side (`"use client"` directive)
