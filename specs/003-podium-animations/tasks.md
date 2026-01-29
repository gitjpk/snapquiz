# Tasks: Final Podium Animations

**Input**: Design documents from `/specs/003-podium-animations/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/  
**Target Stack**: Next.js (App Router) + canvas-confetti + Web Audio API  

## Implementation Strategy (MVP first)

- MVP scope is **User Story 1 (Visual Animations)** + **User Story 2 (Audio Effects)** as P1 priorities
- US1 and US2 can be developed in parallel after setup
- US3 (Audio Control) is P2 and can be delivered as an enhancement

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and prepare audio assets

- [X] T001 Install canvas-confetti and @types/canvas-confetti in package.json
- [X] T002 Create public/audio/podium/ directory structure
- [X] T003 [P] Add placeholder audio files (drumroll.mp3, fanfare.mp3, applause.mp3) in public/audio/podium/
- [X] T004 [P] Define PodiumAnimationPhase enum type in src/lib/types/podium.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for animation and audio that all user stories depend on

- [X] T005 Implement Web Audio API helper with preload/play functions in src/lib/audio/podiumAudio.ts
- [X] T006 [P] Implement usePodiumAnimation hook with state machine in src/hooks/usePodiumAnimation.ts
- [X] T007 [P] Add useReducedMotion hook to detect prefers-reduced-motion in src/hooks/useReducedMotion.ts
- [X] T008 Unit test for usePodiumAnimation state transitions in tests/unit/podiumAnimation.test.ts

**Checkpoint**: Foundation ready — animation and audio infrastructure in place

---

## Phase 3: User Story 1 - Celebratory Visual Animations (Priority: P1) 🎯 MVP

**Goal**: Participants and presenter see engaging visual animations with progressive reveal (3rd → 2nd → 1st) and confetti celebration.

**Independent Test**: Complete a quiz session with 3+ participants, trigger final podium, verify progressive reveal animation plays with confetti burst on 1st place.

### Implementation (US1)

- [X] T009 [US1] Create ConfettiEffect component using canvas-confetti in src/components/game/ConfettiEffect.tsx
- [X] T010 [P] [US1] Add CSS keyframe animations for podium entry (slide-up, fade-in, glow) in src/app/globals.css
- [X] T011 [US1] Create AnimatedPodium wrapper component with phase-based rendering in src/components/game/AnimatedPodium.tsx
- [X] T012 [US1] Implement progressive reveal logic (3rd → 2nd → 1st timing) in src/components/game/AnimatedPodium.tsx
- [X] T013 [US1] Add reduced-motion support (skip to final state) in src/components/game/AnimatedPodium.tsx
- [X] T014 [US1] Optimize animations for mobile (smaller confetti, simpler effects) in src/components/game/ConfettiEffect.tsx
- [X] T015 [US1] Integrate AnimatedPodium into presenter view in src/app/(host)/presenter/[sessionId]/page.tsx
- [X] T016 [US1] Integrate AnimatedPodium into player view in src/app/(player)/play/[sessionId]/page.tsx
- [X] T017 [US1] Handle edge case: fewer than 3 participants (show only available positions) in src/components/game/AnimatedPodium.tsx
- [X] T018 [US1] Handle edge case: 1 participant (show simplified results, no podium animation) in src/components/game/AnimatedPodium.tsx

**Checkpoint**: US1 works end-to-end — visual animations play on all devices

---

## Phase 4: User Story 2 - Celebratory Audio Effects (Priority: P1) 🎯 MVP

**Goal**: Presenter screen plays synchronized audio (drumroll, fanfare) during podium reveal sequence.

**Independent Test**: Trigger final podium on presenter view, verify drumroll plays at start and fanfare plays when 1st place is revealed. Verify participant devices play NO audio.

### Implementation (US2)

- [X] T019 [US2] Preload audio files during session (leaderboard phase) in src/lib/audio/podiumAudio.ts
- [X] T020 [US2] Add drumroll playback at animation start (phase: drumroll) in src/components/game/AnimatedPodium.tsx
- [X] T021 [US2] Add fanfare playback at 1st place reveal (phase: reveal-1st) in src/components/game/AnimatedPodium.tsx
- [X] T022 [P] [US2] Add applause playback at celebration phase in src/components/game/AnimatedPodium.tsx
- [X] T023 [US2] Handle autoplay restrictions (AudioContext unlock on user interaction) in src/lib/audio/podiumAudio.ts
- [X] T024 [US2] Ensure audio is presenter-only (no audio on participant devices) in src/app/(player)/play/[sessionId]/page.tsx
- [X] T025 [P] [US2] Add graceful fallback when audio fails to play (log error, continue animations) in src/lib/audio/podiumAudio.ts

**Checkpoint**: US2 works end-to-end — audio plays on presenter, silent on participants

---

## Phase 5: User Story 3 - Audio Control (Priority: P2)

**Goal**: Host can toggle audio on/off from presenter view, with preference persisted across sessions.

**Independent Test**: Open presenter view, toggle audio off, trigger podium (no sound), toggle audio on, trigger podium (sound plays).

### Implementation (US3)

- [X] T026 [US3] Create AudioToggle component (mute/unmute button) in src/components/game/AudioToggle.tsx
- [X] T027 [US3] Implement localStorage persistence for audio preference in src/lib/audio/audioPreference.ts
- [X] T028 [US3] Add AudioToggle to presenter controls panel in src/app/(host)/presenter/[sessionId]/page.tsx
- [X] T029 [US3] Wire audio preference to podiumAudio helper (skip playback if disabled) in src/lib/audio/podiumAudio.ts
- [X] T030 [US3] Add visual feedback for current audio state in AudioToggle in src/components/game/AudioToggle.tsx

**Checkpoint**: US3 complete — host can control audio preference

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Testing, accessibility, and final touches

- [X] T031 [P] Playwright E2E test for podium animation flow in tests/e2e/podium-animation.spec.ts
- [X] T032 [P] Verify WCAG compliance for reduced-motion support in src/components/game/AnimatedPodium.tsx
- [X] T033 Test performance on mid-range mobile device (target ≥30 FPS)
- [X] T034 Update quickstart.md with final audio asset requirements in specs/003-podium-animations/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) → Foundational (Phase 2) → User Stories (Phases 3-5)
- Polish (Phase 6) depends on completing US1 + US2

### User Story Dependency Graph

- US1 (P1) depends on Phase 2 only
- US2 (P1) depends on Phase 2 only (can parallel with US1)
- US3 (P2) depends on US2 (audio infrastructure)

### Parallel Opportunities (Examples)

**Setup**: T003 and T004 can run in parallel

**Foundational**: T006 and T007 can run in parallel

**US1**: T009 and T010 can run in parallel; T015 and T016 can run in parallel

**US2**: T022 and T025 can run in parallel

**Polish**: T031 and T032 can run in parallel

## Parallel Execution Examples (Per User Story)

### US1 (Visual Animations)

- Workstream A: T009, T010 (CSS + confetti component)
- Workstream B: T011, T012, T013, T017, T018 (AnimatedPodium)
- Workstream C: T015, T016 (page integration)

### US2 (Audio Effects)

- Workstream A: T019, T023, T025 (audio infrastructure)
- Workstream B: T020, T021, T022 (playback triggers)
- Workstream C: T024 (participant silencing)

### US3 (Audio Control)

- Workstream A: T026, T27, T030 (toggle component + persistence)
- Workstream B: T028, T029 (integration)

## Validation: Checklist Format

All implementation tasks in this file use the required checklist format:

- `- [ ] T### [P?] [US#?] Description with file path`
