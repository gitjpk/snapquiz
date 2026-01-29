# Data Model: Final Podium Animations

**Branch**: 003-podium-animations  
**Date**: 2026-01-27  

## Overview

This feature extends the existing `LiveSession` and `Podium` component to add animated reveal sequences and audio effects. The data model changes are minimal since animation state is primarily client-side.

## Entities

### PodiumAnimationPhase (Client-side enum)

Represents the current phase of the podium animation sequence.

**Values**:
- `idle` - Animation not started
- `drumroll` - Anticipation phase, drumroll audio playing (presenter only)
- `reveal-3rd` - 3rd place being revealed
- `reveal-2nd` - 2nd place being revealed
- `reveal-1st` - 1st place being revealed with fanfare
- `celebration` - Confetti and applause
- `complete` - Static final display

**Notes**:
- This is a client-side enum, not persisted to database
- Transitions are time-based (see research.md for timeline)
- Reduced-motion mode skips directly to `complete`

---

### AudioPreference (Presenter setting)

Host setting for whether audio plays during podium.

**Storage**:
- `localStorage` key: `snapquiz:podium-audio-enabled`
- Default value: `true`

**Fields**:
- `enabled`: boolean

**Validation rules**:
- Boolean only
- Falls back to `true` if localStorage is unavailable

**Notes**:
- Not persisted to server; local preference only
- Only affects presenter view (participants never play audio)

---

### LiveSession (Extension)

Existing entity from 001-live-quiz-game. No schema changes required.

**Relevant existing fields**:
- `status`: Already supports `ended` state which triggers podium
- Session end event already broadcasts final leaderboard

**Notes**:
- Podium animation is triggered when session transitions to `ended` and leaderboard is displayed
- Participant count check (≥2 for animated podium) uses existing participant data

---

### LeaderboardEntry (Existing)

Existing type from `src/lib/realtime/events.ts`.

**Relevant existing fields**:
- `participantId`
- `nickname`
- `pointsTotal`
- `rank`

**Notes**:
- Top 3 entries power the podium display
- No changes required

## Relationships

- LiveSession 1—N Participant (existing)
- LiveSession → LeaderboardEntry[] (computed, existing)
- Presenter view has 1 AudioPreference (client-side)

## State Transitions

### PodiumAnimationPhase Sequence

Standard flow (10 seconds total):
```
idle → drumroll (0s) → reveal-3rd (2s) → reveal-2nd (4s) → reveal-1st (6.5s) → celebration (7s) → complete (10s)
```

Reduced-motion flow (<2 seconds):
```
idle → complete (immediate, no intermediate states)
```

### Audio Events (Presenter Only)

| Phase Transition | Audio Event |
|------------------|-------------|
| `idle → drumroll` | Play drumroll.mp3 |
| `reveal-2nd → reveal-1st` | Play fanfare.mp3 |
| `reveal-1st → celebration` | Play applause.mp3 (optional) |

## New Assets Required

### Audio Files

| File | Duration | Size Target | Purpose |
|------|----------|-------------|---------|
| `drumroll.mp3` | ~2s | <100KB | Anticipation during reveal |
| `fanfare.mp3` | ~3s | <150KB | Victory sound for 1st place |
| `applause.mp3` | ~4s | <200KB | Optional celebration loop |

**Location**: `public/audio/podium/`

### No Database Schema Changes

This feature is purely client-side enhancement. All data (leaderboard entries, participant counts) already exists from feature 001.
