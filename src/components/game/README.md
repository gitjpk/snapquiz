# Game Components

This directory contains React components for the quiz game interface.

## Components

### Presenter Components (Host View)

| Component | Description |
|-----------|-------------|
| `PresenterControls.tsx` | Control panel for host (start, next, reveal) |
| `PresenterLobby.tsx` | Waiting room showing participants and QR code |
| `JoinQrCode.tsx` | QR code for mobile join |

### Player Components

| Component | Description |
|-----------|-------------|
| `JoinForm.tsx` | PIN and nickname input form |
| `PlayerLobby.tsx` | Waiting screen for players |
| `PlayerQuestion.tsx` | Question display with answer buttons |

### Shared Game Components

| Component | Description |
|-----------|-------------|
| `AnswerReveal.tsx` | Shows correct answer and distribution |
| `Leaderboard.tsx` | Current standings table |
| `Podium.tsx` | Static podium display for top 3 |
| `AnimatedPodium.tsx` | Animated podium with reveal sequence |
| `ConfettiEffect.tsx` | Celebration confetti animation |
| `AppShell.tsx` | Layout wrapper for game views |

## PlayerQuestion

The main component for player interaction during questions.

### Features

- **Kahoot-style colors**: Red, Blue, Yellow, Green for answers
- **Large touch targets**: Minimum 100px height for mobile
- **Timer display**: Countdown with progress bar
- **Answer feedback**: Visual confirmation when answered
- **Accessibility**: ARIA labels, keyboard navigation

### Color Scheme

```typescript
const optionColors = [
  "bg-red-500",    // Option A
  "bg-blue-500",   // Option B  
  "bg-yellow-500", // Option C
  "bg-green-500",  // Option D
  "bg-purple-500", // Option E (if 5+ options)
  "bg-orange-500", // Option F (if 6 options)
];
```

## AnimatedPodium

Celebratory reveal sequence for top 3 players at game end.

### Animation Phases

1. `intro` - Initial setup
2. `third_reveal` - 3rd place appears
3. `second_reveal` - 2nd place appears  
4. `first_reveal` - 1st place with confetti
5. `celebration` - Final celebration
6. `complete` - Animation finished

### Audio Integration

```typescript
import { playAudio } from "@/lib/audio/podiumAudio";

// During reveal
playAudio("drumroll");  // Before each reveal
playAudio("fanfare");   // On 1st place
playAudio("applause");  // Celebration
```

### Reduced Motion

Users with `prefers-reduced-motion` enabled skip animations:
- Podium displays immediately in final state
- No audio playback
- Confetti is disabled

## Mobile Considerations

- Touch-friendly button sizes (min-h-[100px])
- Safe area padding for notched devices
- `touch-manipulation` for fast tap response
- Responsive text sizing (text-base on mobile, text-lg on tablet+)
- Word wrapping for long answer text
