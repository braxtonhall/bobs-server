/*
  Warnings:

  - The required column `userId` was added to the `Entry` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `userId` was added to the `Season` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Entry" (
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
INSERT INTO "new_Entry" ("djId", "id", "recipientId", "seasonId", "submissionUrl") SELECT "djId", "id", "recipientId", "seasonId", "submissionUrl" FROM "Entry";
DROP TABLE "Entry";
ALTER TABLE "new_Entry" RENAME TO "Entry";
CREATE UNIQUE INDEX "Entry_userId_key" ON "Entry"("userId");
CREATE TABLE "new_Season" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "ruleCount" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'sign-up',
    CONSTRAINT "Season_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Season" ("id", "name", "ownerId", "ruleCount", "state") SELECT "id", "name", "ownerId", "ruleCount", "state" FROM "Season";
DROP TABLE "Season";
ALTER TABLE "new_Season" RENAME TO "Season";
CREATE UNIQUE INDEX "Season_userId_key" ON "Season"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
