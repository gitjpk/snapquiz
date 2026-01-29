# Feature Specification: Final Podium Animations

**Feature Branch**: `003-podium-animations`  
**Created**: 2026-01-27  
**Status**: Draft  
**Input**: User description: "Il y aura des animations visuelles et audios sur le podium final" (Visual and audio animations on the final podium)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Celebratory Visual Animations on Podium (Priority: P1)

As a participant and presenter, when the final podium is displayed, I see engaging visual animations that celebrate the top performers and create an exciting, memorable moment.

**Why this priority**: Visual animations are the core of the "wow" moment that makes the end of a quiz session memorable and shareable. This is what creates energy and engagement.

**Independent Test**: Complete a quiz session with at least 3 participants, trigger the final podium, and verify that visual animations play (e.g., confetti, spotlight effects, podium reveal sequence).

**Acceptance Scenarios**:

1. **Given** a quiz session has ended, **When** the final podium is displayed, **Then** an animated entrance sequence reveals the top 3 winners progressively (3rd → 2nd → 1st).
2. **Given** the podium is being revealed, **When** the 1st place winner is announced, **Then** a celebratory effect (confetti, sparkles, or spotlight) highlights the winner.
3. **Given** the animations are playing, **When** viewed on the presenter screen (shared display), **Then** the animations are smooth and visually impressive at large screen sizes.
4. **Given** the animations are playing, **When** viewed on a participant's mobile device, **Then** the animations are visible but optimized for smaller screens and lower bandwidth.

---

### User Story 2 - Celebratory Audio Effects on Podium (Priority: P1)

As a presenter and participants, when the final podium is displayed, I hear audio effects that enhance the celebratory atmosphere and build excitement.

**Why this priority**: Audio complements visuals and significantly amplifies the emotional impact. A silent podium feels anticlimactic.

**Independent Test**: Complete a quiz session, trigger the final podium with audio enabled, and verify that sound effects play at appropriate moments (fanfare, drumroll, applause).

**Acceptance Scenarios**:

1. **Given** the final podium is displayed, **When** the podium reveal sequence starts, **Then** a drumroll or anticipation sound effect plays on the presenter screen.
2. **Given** the 1st place winner is revealed, **When** their name/avatar appears, **Then** a victory fanfare or celebration sound plays on the presenter screen.
3. **Given** the podium is displayed on the presenter screen, **When** audio plays, **Then** it is loud and clear for the room.
4. **Given** the podium is displayed on a participant's device, **When** the podium is shown, **Then** visual animations play but no audio is emitted (audio is presenter-only).

---

### User Story 3 - Audio Control (Mute/Unmute) (Priority: P2)

As a host, I can control whether audio plays during the podium so that I can adapt to different environments (e.g., quiet venues, virtual meetings).

**Why this priority**: Not all venues support audio; hosts need flexibility to disable sound without losing visual impact.

**Independent Test**: Access host settings, toggle audio off, trigger podium, verify no audio plays; toggle audio on, trigger podium again, verify audio plays.

**Acceptance Scenarios**:

1. **Given** a host is on the presenter view, **When** they access audio settings, **Then** they see a toggle to enable/disable podium audio.
2. **Given** audio is disabled, **When** the final podium is displayed, **Then** visual animations play but no sound is emitted.
3. **Given** audio is enabled (default), **When** the final podium is displayed, **Then** both visual and audio effects play together.

---

### Edge Cases

- Device does not support audio playback (animations still play, graceful degradation).
- Browser blocks autoplay audio (show a "tap to enable sound" prompt or mute gracefully).
- Participant leaves before podium (remaining participants and presenter still see full experience).
- Session has fewer than 3 participants (adapt podium display: show only available positions; minimum 2 participants required for animated podium).
- Session has only 1 participant (show simplified results screen without podium animation).
- Network latency causes audio/visual desync (design for tolerance, prefer visual-first).
- Animations cause performance issues on older devices (provide reduced-motion option).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an animated podium sequence when a quiz session ends with ranked results.
- **FR-002**: System MUST reveal podium positions progressively (3rd place → 2nd place → 1st place) with visual transitions.
- **FR-003**: System MUST display celebratory visual effects (confetti, sparkles, spotlights, or similar) when the winner is revealed.
- **FR-004**: System MUST play audio effects synchronized with podium reveal moments (drumroll, fanfare, applause).
- **FR-005**: System MUST allow the host to toggle audio on/off from the presenter view.
- **FR-006**: System MUST gracefully handle browsers that block autoplay audio (fallback to muted or prompt user).
- **FR-007**: System MUST optimize animations for both large shared screens (presenter) and small mobile screens (participants).
- **FR-008**: System MUST support a reduced-motion preference for users with motion sensitivity (respects `prefers-reduced-motion`).
- **FR-009**: System MUST require at least 2 participants to display the animated podium; sessions with only 1 participant show a simplified results screen instead.
- **FR-010**: System MUST ensure animations do not block or delay the display of final results data.

### Assumptions

- Audio files are bundled with the application or loaded from a CDN; no user-uploaded audio.
- Default audio is pre-selected and appropriate for all audiences (no offensive content).
- Visual animations use standard web technologies (CSS animations, Canvas, or lightweight libraries) that work across modern browsers.
- The podium animation duration is fixed (e.g., 10-15 seconds) and cannot be customized by the host in MVP.
- Audio plays only on the presenter screen by default; participant devices show visual animations without sound to avoid cacophony in workshop settings.

## Clarifications

### Session 2026-01-27

- Q: L'audio joue-t-il sur les appareils des participants ou uniquement sur le présentateur ? → A: Audio sur présentateur uniquement (participants = visuel seulement)
- Q: Que se passe-t-il si la session a seulement 1 participant ? → A: Minimum 2 participants requis pour le podium animé (1 seul = écran de résultat simplifié)

### Key Entities

- **PodiumState**: Represents the current phase of the podium animation (pending, revealing_3rd, revealing_2nd, revealing_1st, complete).
- **AudioPreference**: Host setting for whether audio is enabled for the session (stored in session or presenter state).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of users rate the podium experience as "exciting" or "very exciting" in post-session feedback.
- **SC-002**: Podium animation sequence completes within 15 seconds from trigger to final display.
- **SC-003**: Visual animations render smoothly (≥30 FPS) on mid-range mobile devices from the past 3 years.
- **SC-004**: Audio plays successfully on presenter devices in 90% of sessions where audio is enabled.
- **SC-005**: Reduced-motion preference is respected, with fallback animations completing in under 5 seconds.
- **SC-006**: Host can toggle audio setting within 2 taps/clicks from the presenter view.
