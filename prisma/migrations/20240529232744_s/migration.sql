/*
  Warnings:

  - You are about to drop the column `stylesheets` on the `Box` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Box" (
    "sort" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "origin" TEXT,
    "ownerId" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "stylesheet" TEXT,
    CONSTRAINT "Box_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Box" ("deleted", "id", "name", "origin", "ownerId", "sort") SELECT "deleted", "id", "name", "origin", "ownerId", "sort" FROM "Box";
DROP TABLE "Box";
ALTER TABLE "new_Box" RENAME TO "Box";
CREATE UNIQUE INDEX "Box_id_key" ON "Box"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
