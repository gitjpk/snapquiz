# Research: Final Podium Animations

**Branch**: 003-podium-animations  
**Date**: 2026-01-27  
**Goal**: Resolve technical decisions needed to implement celebratory visual and audio animations for the final podium.

## Decision 1: Confetti/Celebration Library

- **Decision**: Use **canvas-confetti** for confetti effects.
- **Rationale**: 
  - Lightweight (~17KB bundle)
  - Built-in Web Worker support for off-main-thread rendering
  - Native `disableForReducedMotion` option for accessibility
  - Promise-based API for easy sequencing
  - Battle-tested, widely adopted
- **Alternatives considered**:
  - react-confetti: Larger bundle (~220KB), React-specific but not as performant
  - @tsparticles: Feature-rich but more complex API than needed for MVP

## Decision 2: Animation Approach (CSS + State Machine)

- **Decision**: Use CSS transforms/opacity with a custom React state machine for sequencing; avoid heavy animation libraries for MVP.
- **Rationale**: 
  - `transform` and `opacity` animations run on GPU, achieving 60fps without layout/paint costs
  - A simple state machine (React useState + useEffect) handles the reveal sequence without external dependencies
  - Keeps bundle size minimal; Framer Motion (~50KB) not needed for linear sequences
- **Alternatives considered**:
  - Framer Motion: Powerful spring physics, but overkill for linear timed sequences
  - GSAP: Industry-standard but larger bundle and licensing considerations
  - Pure CSS keyframes only: Less controllable timing for audio sync

## Decision 3: Audio Playback Strategy

- **Decision**: Use **Web Audio API** (AudioContext + AudioBufferSourceNode) for precise timing, with preloading during session.
- **Rationale**: 
  - Web Audio API provides frame-accurate playback timing, essential for syncing fanfare with 1st place reveal
  - AudioContext can be created after user interaction (host clicks "Show Podium"), avoiding autoplay restrictions
  - Preloading audio during the leaderboard phase ensures instant playback
- **Alternatives considered**:
  - HTML5 Audio element: Simpler API but less precise timing and harder to sequence multiple sounds
  - Howler.js: Nice abstraction but adds ~10KB for functionality we can implement natively

## Decision 4: Audio Format

- **Decision**: Use MP3 as primary format with WebM/Opus fallback for modern browsers.
- **Rationale**: 
  - MP3 has universal browser support
  - WebM/Opus offers better compression for browsers that support it (Chrome, Firefox, Edge)
  - Total audio assets should be under 500KB (short sound effects)
- **Alternatives considered**:
  - WAV: Too large for network delivery
  - OGG Vorbis: Good quality but MP3+WebM covers same browsers with better support

## Decision 5: Animation Sequence Timing

- **Decision**: Fixed 10-second reveal sequence with the following timeline:
  ```
  0.0s - Drumroll audio starts, empty podiums fade in
  2.0s - 3rd place reveals (slide up + fade in)
  4.0s - 2nd place reveals (slide up + fade in)
  6.0s - Fanfare audio starts
  6.5s - 1st place reveals (slide up + glow effect)
  7.0s - Confetti burst
  10.0s - Sequence complete, static display
  ```
- **Rationale**: 
  - Builds anticipation progressively
  - 10 seconds is engaging without being tedious
  - Allows audio sync points at 0s and 6s
- **Alternatives considered**:
  - Faster sequence (5s): Less dramatic, feels rushed
  - Host-configurable timing: Adds complexity; fixed timing is sufficient for MVP

## Decision 6: Reduced Motion Support

- **Decision**: Respect `prefers-reduced-motion` media query: skip animations and show final state immediately (under 2 seconds).
- **Rationale**: 
  - Accessibility requirement from spec (FR-008)
  - canvas-confetti has native support via `disableForReducedMotion`
  - CSS animations can be disabled with `@media (prefers-reduced-motion: reduce)`
- **Alternatives considered**:
  - Manual toggle in UI: Additional complexity; system preference is sufficient

## Decision 7: State Management for Animation Phases

- **Decision**: Use a custom `usePodiumAnimation` hook with an enum-based state machine.
- **Rationale**: 
  - Phases: `idle` → `drumroll` → `reveal-3rd` → `reveal-2nd` → `reveal-1st` → `celebration` → `complete`
  - Simple `useEffect` with timeouts handles transitions
  - Audio playback triggered at specific phase transitions
  - No external state management library needed
- **Alternatives considered**:
  - XState: Powerful but adds dependency for a linear sequence
  - Redux/Zustand: Overkill for component-local animation state

## Decision 8: Audio Toggle Persistence

- **Decision**: Store audio preference in presenter's `localStorage` and in session state via WebSocket.
- **Rationale**: 
  - `localStorage` remembers preference across browser sessions for returning hosts
  - WebSocket broadcast ensures participant views know audio is presenter-only (no action needed on their end)
- **Alternatives considered**:
  - Database persistence: Unnecessary for a per-host preference
  - Session-only state: Host would need to reconfigure each time
