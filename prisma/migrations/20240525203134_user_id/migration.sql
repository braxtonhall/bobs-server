/*
  Warnings:

  - The primary key for the `Season` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `Season` table. All the data in the column will be lost.
  - Added the required column `sort` to the `Season` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Season" (
    "sort" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleCount" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'sign-up',
    CONSTRAINT "Season_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Season" ("description", "id", "name", "ownerId", "ruleCount", "state") SELECT "description", "id", "name", "ownerId", "ruleCount", "state" FROM "Season";
DROP TABLE "Season";
ALTER TABLE "new_Season" RENAME TO "Season";
CREATE UNIQUE INDEX "Season_id_key" ON "Season"("id");
CREATE TABLE "new_Entry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "djId" INTEGER,
    "submissionUrl" TEXT,
    CONSTRAINT "Entry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entry_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entry_djId_fkey" FOREIGN KEY ("djId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Entry" ("djId", "id", "recipientId", "seasonId", "submissionUrl", "userId") SELECT "djId", "id", "recipientId", "seasonId", "submissionUrl", "userId" FROM "Entry";
DROP TABLE "Entry";
ALTER TABLE "new_Entry" RENAME TO "Entry";
CREATE UNIQUE INDEX "Entry_userId_key" ON "Entry"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
