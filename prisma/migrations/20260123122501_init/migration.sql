-- CreateTable
CREATE TABLE "Host" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerHostId" TEXT,
    CONSTRAINT "Quiz_ownerHostId_fkey" FOREIGN KEY ("ownerHostId") REFERENCES "Host" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "timeLimitSeconds" INTEGER NOT NULL DEFAULT 20,
    "mediaType" TEXT,
    "mediaUrl" TEXT,
    CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnswerOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AnswerOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'lobby',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "currentQuestionIndex" INTEGER,
    "questionStartedAt" DATETIME,
    "leaderboardTopN" INTEGER NOT NULL DEFAULT 5,
    CONSTRAINT "LiveSession_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "Participant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCorrect" BOOLEAN NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Response_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Response_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Response_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Response_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "AnswerOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "pointsTotal" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Score_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Score_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Question_quizId_idx" ON "Question"("quizId");

-- CreateIndex
CREATE INDEX "AnswerOption_questionId_idx" ON "AnswerOption"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "LiveSession_pin_key" ON "LiveSession"("pin");

-- CreateIndex
CREATE INDEX "LiveSession_pin_idx" ON "LiveSession"("pin");

-- CreateIndex
CREATE INDEX "LiveSession_status_idx" ON "LiveSession"("status");

-- CreateIndex
CREATE INDEX "Participant_sessionId_idx" ON "Participant"("sessionId");

-- CreateIndex
CREATE INDEX "Response_sessionId_idx" ON "Response"("sessionId");

-- CreateIndex
CREATE INDEX "Response_questionId_idx" ON "Response"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Response_participantId_questionId_key" ON "Response"("participantId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Score_participantId_key" ON "Score"("participantId");

-- CreateIndex
CREATE INDEX "Score_sessionId_idx" ON "Score"("sessionId");

-- CreateIndex
CREATE INDEX "Score_pointsTotal_idx" ON "Score"("pointsTotal" DESC);
