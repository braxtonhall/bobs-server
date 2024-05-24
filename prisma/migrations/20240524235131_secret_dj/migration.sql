-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "html" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "temporaryToken" TEXT,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "expiration" DATETIME NOT NULL,
    CONSTRAINT "Token_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Season" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleCount" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'sign-up',
    CONSTRAINT "Season_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "playlistEntryId" INTEGER NOT NULL,
    CONSTRAINT "Rule_playlistEntryId_fkey" FOREIGN KEY ("playlistEntryId") REFERENCES "Entry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "djId" INTEGER,
    "submissionUrl" TEXT,
    CONSTRAINT "Entry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entry_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entry_djId_fkey" FOREIGN KEY ("djId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "emailId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Participant_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_temporaryToken_key" ON "Token"("temporaryToken");

-- CreateIndex
CREATE UNIQUE INDEX "Season_userId_key" ON "Season"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_userId_key" ON "Entry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_emailId_key" ON "Participant"("emailId");
