/*
  Warnings:

  - You are about to drop the column `signupOpen` on the `Season` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Season" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ruleCount" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'sign-up'
);
INSERT INTO "new_Season" ("id", "name", "ruleCount") SELECT "id", "name", "ruleCount" FROM "Season";
DROP TABLE "Season";
ALTER TABLE "new_Season" RENAME TO "Season";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
