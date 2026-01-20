# Feature Specification: Live Quiz Game Sessions

**Feature Branch**: `001-live-quiz-game`  
**Created**: 2026-01-20  
**Status**: Draft  
**Input**: User description: "Modern and sleek game-based learning website where a host runs a live quiz session and participants join via PIN/QR, answer in real time, earn points for correctness and speed, and see leaderboards/podium."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Join and Play a Live Session (Priority: P1)

As a participant, I can join a live quiz session in seconds using a short PIN (or QR code), pick a nickname, and answer questions in real time from my phone.

**Why this priority**: This is the core product experience (“join in seconds” + live play). Without it, the platform does not deliver workshop value.

**Independent Test**: A single host can run a demo session with at least one multiple-choice question; a participant joins via PIN/QR, submits an answer before the timer ends, and sees whether they were correct.

**Acceptance Scenarios**:

1. **Given** an active session with a displayed PIN, **When** a participant enters the PIN and provides a nickname, **Then** they join the lobby and see a “waiting for start” state.
2. **Given** the host starts a question, **When** the participant selects an answer before time expires, **Then** the participant sees a confirmation state (answered/locked in) and cannot change their answer after lock.
3. **Given** the participant enters an invalid or expired PIN, **When** they try to join, **Then** they see a clear error and a path to retry.

---

### User Story 2 - Host Runs a Two-Screen Game (Priority: P2)

As a host, I can launch a session from a quiz, see a presenter-friendly view, and control the game flow (lobby → question → reveal → leaderboard → next).

**Why this priority**: Live sessions are host-driven and must work reliably on a shared screen while participants play on their own devices.

**Independent Test**: With an existing quiz, a host launches a session, observes the lobby count, starts the game, advances through at least one question, reveals answers, and shows a leaderboard.

**Acceptance Scenarios**:

1. **Given** a quiz with at least one multiple-choice question, **When** the host starts a new live session, **Then** the system generates a unique PIN and a join link (including a QR code representation).
2. **Given** participants have joined the lobby, **When** the host starts the game, **Then** participants see the first question and the host sees the presenter view controls.
3. **Given** a question has ended, **When** the host triggers answer reveal and then leaderboard, **Then** participants and the shared screen show the corresponding states in a consistent order.

---

### User Story 3 - Energy and Competition (Scoring + Leaderboard + Podium) (Priority: P3)

As a participant, I receive points for correct answers and faster responses, I see my rank after each question, and I see a final podium at the end.

**Why this priority**: Game mechanics create engagement and “energy,” making the experience fun and competitive.

**Independent Test**: Run a short session with two participants answering at different speeds; the system produces a leaderboard after a question and a final podium at session end.

**Acceptance Scenarios**:

1. **Given** two participants answer the same question correctly at different times, **When** scores are calculated, **Then** the faster correct respondent receives more points than the slower correct respondent.
2. **Given** a question has completed, **When** the leaderboard is shown, **Then** the top N participants are displayed and each participant can see their own score and rank.
3. **Given** the last question is complete, **When** the game ends, **Then** the final podium shows the top 3 (or top 5) and participants can see their final result.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- Participant enters a valid PIN for a session that is full or already ended.
- Participant loses connection mid-question and returns (rejoin behavior, answer state).
- Duplicate nicknames (collision handling without blocking the lobby).
- Host refreshes or reconnects during a live session (session continuity).
- Participant joins late (after game started) and sees an appropriate state.
- Media (image/video) fails to load for a question; experience remains usable.
- Timer expires while participant is selecting an answer.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST allow a host to create, edit, and reuse quizzes.
- **FR-002**: A quiz MUST support multiple-choice questions with 2–6 answer options.
- **FR-003**: A question MAY include optional media (image or video) that is visible to the host and participants during the question.
- **FR-004**: System MUST allow a host to start a live session from a selected quiz.
- **FR-005**: System MUST generate a unique, human-friendly session PIN for each live session.
- **FR-006**: System MUST allow participants to join a session by entering the PIN or using a join link.
- **FR-007**: System MUST show a lobby/waiting room state that includes participant count and indicates whether the game has started.
- **FR-008**: System MUST allow a participant to set a display nickname before participating.
- **FR-009**: System MUST display questions on participant devices when the host starts each question.
- **FR-010**: System MUST enforce a per-question time limit and lock answers when time expires.
- **FR-011**: System MUST record each participant’s answer choice and answer timestamp for each question.
- **FR-012**: System MUST determine correctness per response based on the question’s configured correct option(s).
- **FR-013**: System MUST award points based on correctness and response speed (faster correct answers yield more points).
- **FR-014**: System MUST show an answer reveal state after each question, including which option(s) were correct and the distribution of participant selections.
- **FR-015**: System MUST show a leaderboard after each question with the top N participants (N configurable per session, defaulting to 5).
- **FR-016**: System MUST show a final results state at the end of the session, including a podium (top 3 by default) and each participant’s final score and rank.
- **FR-017**: System MUST provide a presenter-friendly view designed for screen sharing, with large readable typography and high contrast.
- **FR-018**: System MUST provide a player-friendly view with large tap targets and minimal distractions.
- **FR-019**: System MUST prevent non-host participants from advancing the game or changing game state.
- **FR-020**: System MUST handle invalid PINs and ended sessions with clear, user-friendly error messages.
- **FR-021**: System MUST protect user-entered content from being executed as code in any user-visible screen (e.g., nicknames, quiz titles).

### Assumptions

- Participants do not need to create accounts to join a session; a nickname is sufficient for live play.
- Hosts have a consistent identity so they can create and reuse quizzes (how hosts sign in is out of scope for this spec).
- A typical workshop session supports at least 200 concurrent participants; larger targets can be added later.

### Key Entities *(include if feature involves data)*

- **Host**: A person who creates quizzes and runs live sessions; owns quizzes and can start/end sessions.
- **Quiz**: A reusable set of questions with a title and optional description.
- **Question**: A single prompt with 2–6 options, one correct option, optional timer, and optional media.
- **Live Session**: A time-bounded game instance created from a quiz; has a unique PIN, status (lobby/in progress/ended), and current question index.
- **Participant**: A person who joins a live session using a PIN/link; has a nickname and participation status (active/disconnected).
- **Response**: A participant’s answer submission for a given question, including selection and submission time.
- **Score**: The points accumulated by a participant within a session, derived from responses.
- **Leaderboard**: A ranked view of participant scores for a session.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 90% of first-time participants can join a session and submit an answer within 30 seconds, without assistance.
- **SC-002**: For a session with 200 concurrent participants, 95% of participants see a newly started question on their device within 2 seconds.
- **SC-003**: After a question ends, the answer reveal and leaderboard are visible to participants within 3 seconds for 95% of questions in a 200-participant session.
- **SC-004**: In usability testing, at least 8/10 hosts can start a session, run one question, and show a leaderboard without facilitator help.
- **SC-005**: During a 30-minute workshop, fewer than 2% of join attempts fail due to system errors (excluding user-entry mistakes like typing the wrong PIN).
