/*
  Warnings:

  - Added the required column `updatedAt` to the `List` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_List" (
    "link" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "watchlist" BOOLEAN NOT NULL,
    "owner" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_List" ("link", "name", "owner", "watchlist") SELECT "link", "name", "owner", "watchlist" FROM "List";
DROP TABLE "List";
ALTER TABLE "new_List" RENAME TO "List";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
