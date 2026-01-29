# Implementation Plan: Final Podium Animations

**Branch**: `003-podium-animations` | **Date**: 2026-01-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-podium-animations/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Add celebratory visual animations (confetti, progressive reveal) and audio effects (drumroll, fanfare) to the final podium display. Audio plays only on the presenter screen; all devices see visual animations. Supports reduced-motion accessibility.

Technical approach: Extend existing `Podium.tsx` component with a state machine for animation phases, use canvas-confetti for celebration effects, and Web Audio API for precise audio timing.

## Technical Context

**Language/Version**: TypeScript (Node.js 20 LTS)  
**Primary Dependencies**: Next.js (App Router), React, Tailwind CSS, canvas-confetti (new), Web Audio API (native)  
**Storage**: N/A (client-side feature, no database changes)  
**Testing**: Vitest (unit), Playwright (E2E for animation flow)  
**Target Platform**: Modern evergreen browsers (mobile + desktop)  
**Project Type**: single  
**Performance Goals**: ≥30 FPS on mid-range mobile devices; animation sequence completes in 10s (2s for reduced-motion)  
**Constraints**: Audio presenter-only; respect prefers-reduced-motion; audio files <500KB total  
**Scale/Scope**: Enhancement to existing podium component; no API changes required

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

GATE: All items must be satisfied to proceed.

- ✅ Accessible, Responsive UX: Reduced-motion support (FR-008); animations optimized for mobile (FR-007); keyboard/focus states preserved.
- ✅ Secure-by-Default: No user input involved; audio files are static assets bundled with app.
- ✅ Dynamic Data: Leverages existing leaderboard data; no new server mutations.
- ✅ Reliability: Graceful degradation if audio blocked (FR-006); animations don't block results (FR-010).
- ✅ Keep It Simple: Single dependency added (canvas-confetti); client-side state machine; no external services.

Quality Gates: Unit tests for animation state machine; E2E test for podium reveal flow.

Post-Design Re-check (after Phase 1 outputs): **PASS** (no violations identified).

## Project Structure

### Documentation (this feature)

```text
specs/003-podium-animations/
├── plan.md              # This file
├── research.md          # Phase 0 output - technical decisions
├── data-model.md        # Phase 1 output - entities and state
├── quickstart.md        # Phase 1 output - dev setup guide
├── contracts/           # Phase 1 output - event schemas
│   ├── asyncapi.yaml    # WebSocket events for phase sync
│   └── openapi.yaml     # Asset requirements (no new HTTP APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (host)/
│   │   └── presenter/
│   │       └── [sessionId]/
│   │           └── page.tsx      # Add audio toggle
│   └── (player)/
│       └── play/
│           └── [sessionId]/
│               └── page.tsx      # Use AnimatedPodium
├── components/
│   └── game/
│       ├── Podium.tsx            # Existing - extend with phases
│       ├── AnimatedPodium.tsx    # New - animated wrapper
│       ├── ConfettiEffect.tsx    # New - confetti burst component
│       └── AudioToggle.tsx       # New - mute/unmute button
├── hooks/
│   └── usePodiumAnimation.ts     # New - state machine hook
└── lib/
    └── audio/
        └── podiumAudio.ts        # New - Web Audio API helper

public/
└── audio/
    └── podium/
        ├── drumroll.mp3          # New - anticipation sound
        ├── fanfare.mp3           # New - victory sound
        └── applause.mp3          # New - celebration sound

tests/
├── unit/
│   └── podiumAnimation.test.ts   # New - state machine tests
└── e2e/
    └── podium-animation.spec.ts  # New - visual/audio flow test
```

**Structure Decision**: Extend existing component architecture. New animation logic isolated in dedicated hook and components. Audio files served as static assets.

## Complexity Tracking

No constitution violations. No complexity justifications needed.

## Phase 0: Research Output

See [research.md](research.md) for technical decisions:
- canvas-confetti for celebration effects
- CSS transforms for GPU-accelerated animations
- Web Audio API for precise audio timing
- State machine with 7 phases for reveal sequence
- localStorage for audio preference persistence

## Phase 1: Design Outputs

- Data model: [data-model.md](data-model.md) - Animation phases, audio preference
- API contracts: [contracts/](contracts/) - WebSocket events for phase sync
- Local dev quickstart: [quickstart.md](quickstart.md) - Setup and testing guide

## Phase 2: Task Planning (Stop Point)

Phase 2 breaks the implementation into independently shippable tasks. This is produced by `/speckit.tasks`.

**Suggested task groups for Phase 2:**
1. Audio infrastructure (Web Audio helper, asset loading)
2. Animation state machine (hook + timing)
3. Visual components (AnimatedPodium, ConfettiEffect)
4. Presenter controls (AudioToggle)
5. Integration (wire up to existing pages)
6. Testing (unit + E2E)
