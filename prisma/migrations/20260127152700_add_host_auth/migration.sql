-- CreateTable
CREATE TABLE "HostCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passwordHash" TEXT NOT NULL,
    "jwtSecret" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HostSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "ipAddress" TEXT,
    "userAgent" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "HostSession_tokenId_key" ON "HostSession"("tokenId");

-- CreateIndex
CREATE INDEX "HostSession_tokenId_idx" ON "HostSession"("tokenId");

-- CreateIndex
CREATE INDEX "HostSession_expiresAt_idx" ON "HostSession"("expiresAt");
