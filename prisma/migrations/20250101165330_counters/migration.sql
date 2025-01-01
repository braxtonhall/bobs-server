/*
  Warnings:

  - The primary key for the `Counter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `sort` to the `Counter` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Counter" (
    "sort" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "origin" TEXT,
    "ownerId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Counter_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Counter" ("count", "id", "name", "origin", "ownerId") SELECT "count", "id", "name", "origin", "ownerId" FROM "Counter";
DROP TABLE "Counter";
ALTER TABLE "new_Counter" RENAME TO "Counter";
CREATE UNIQUE INDEX "Counter_id_key" ON "Counter"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
