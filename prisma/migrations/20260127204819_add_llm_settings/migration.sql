-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN "generatedFrom" TEXT;

-- CreateTable
CREATE TABLE "LLMSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiEndpoint" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "detectedModel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LLMSettings_hostId_key" ON "LLMSettings"("hostId");

-- CreateIndex
CREATE INDEX "LLMSettings_hostId_idx" ON "LLMSettings"("hostId");
