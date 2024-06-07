/*
  Warnings:

  - Added the required column `persona` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "expiration" DATETIME
);
INSERT INTO "new_Message" ("address", "expiration", "html", "id", "subject") SELECT "address", "expiration", "html", "id", "subject" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
