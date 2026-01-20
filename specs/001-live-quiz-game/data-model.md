# Data Model: Live Quiz Game Sessions

**Branch**: 001-live-quiz-game  
**Date**: 2026-01-20  

## Overview

This feature centers around a reusable `Quiz` that is used to create a time-bounded `LiveSession`. Participants join the session via PIN/link, submit `Response` records during questions, and accumulate `Score` which drives the `Leaderboard`.

## Entities

### Host
Represents the person controlling the game.

**Fields**
- `id`: unique identifier
- `displayName`: optional
- `createdAt`

**Notes**
- MVP may operate in a single-host mode; future iteration can add authentication and multi-tenant ownership.

---

### Quiz
Reusable quiz definition.

**Fields**
- `id`
- `title` (required)
- `description` (optional)
- `createdAt`, `updatedAt`
- `ownerHostId` (optional for MVP)

**Validation rules**
- `title` is required, trimmed, max length (e.g., 120)

---

### Question
A single multiple-choice prompt.

**Fields**
- `id`
- `quizId` (FK → Quiz)
- `orderIndex` (0..N-1)
- `prompt` (required)
- `timeLimitSeconds` (required; reasonable bounds e.g., 5–120)
- `mediaType` (optional; e.g., `image` | `video`)
- `mediaUrl` (optional)

**Validation rules**
- `prompt` required, trimmed
- `timeLimitSeconds` required and within bounds
- `mediaUrl` must be a valid URL when provided

---

### AnswerOption
An option shown to participants.

**Fields**
- `id`
- `questionId` (FK → Question)
- `orderIndex` (0..5)
- `label` (required)
- `isCorrect` (boolean; exactly one true for MVP)

**Validation rules**
- 2–6 options per question
- exactly one `isCorrect = true` (MVP)

---

### LiveSession
A live run of a quiz.

**Fields**
- `id`
- `quizId` (FK → Quiz)
- `pin` (6-digit string)
- `status` (`lobby` | `in_progress` | `ended`)
- `createdAt`, `startedAt`, `endedAt` (timestamps)
- `currentQuestionIndex` (nullable until started)
- `leaderboardTopN` (default 5)

**Validation rules**
- `pin` unique among active sessions (`lobby`/`in_progress`)
- `leaderboardTopN` positive integer with sane bounds

---

### Participant
A person in a session.

**Fields**
- `id`
- `sessionId` (FK → LiveSession)
- `nickname` (required)
- `joinedAt`
- `status` (`active` | `disconnected` | `left`)

**Validation rules**
- `nickname` required, trimmed, max length (e.g., 24)
- nicknames may collide; UI should disambiguate (e.g., add suffix) without blocking join

---

### Response
A submitted answer by a participant for a specific question.

**Fields**
- `id`
- `sessionId` (FK → LiveSession)
- `participantId` (FK → Participant)
- `questionId` (FK → Question)
- `selectedOptionId` (FK → AnswerOption)
- `submittedAt`
- `isCorrect` (derived or stored)
- `pointsAwarded` (derived or stored)

**Validation rules**
- one response per participant per question (enforced by unique constraint)
- `submittedAt` must be within the question window to be considered valid

---

### Score (materialized per session)
Current points for a participant.

**Fields**
- `sessionId` (FK → LiveSession)
- `participantId` (FK → Participant)
- `pointsTotal`
- `updatedAt`

**Notes**
- Can be computed on the fly from `Response` or materialized for speed.

## Relationships

- Quiz 1—N Question
- Question 1—N AnswerOption
- Quiz 1—N LiveSession
- LiveSession 1—N Participant
- Participant 1—N Response
- LiveSession 1—N Response

## State Transitions

### LiveSession.status

- `lobby` → `in_progress` (host starts game)
- `in_progress` → `ended` (host ends game or last question completes)

### Question lifecycle (per session)

- `not_started` → `open` (question broadcast, timer begins)
- `open` → `closed` (timer expires or host closes)
- `closed` → `revealed` (correct answer + distribution shown)
- `revealed` → `leaderboard` (leaderboard shown)
- `leaderboard` → `open` (next question) OR → `ended` (final podium)
