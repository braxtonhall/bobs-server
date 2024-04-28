-- CreateTable
CREATE TABLE "Season" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ruleCount" INTEGER NOT NULL,
    "signupOpen" BOOLEAN NOT NULL DEFAULT true
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
    CONSTRAINT "Participant_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_emailId_key" ON "Participant"("emailId");
