/*
  Warnings:

  - The primary key for the `Counter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `sort` to the `Counter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unique` to the `Counter` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "CounterView" (
    "counterId" TEXT NOT NULL,
    "posterId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY ("counterId", "posterId"),
    CONSTRAINT "CounterView_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "Counter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CounterView_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "Poster" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "unique" BOOLEAN NOT NULL,
    CONSTRAINT "Counter_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Counter" ("count", "id", "name", "origin", "ownerId") SELECT "count", "id", "name", "origin", "ownerId" FROM "Counter";
DROP TABLE "Counter";
ALTER TABLE "new_Counter" RENAME TO "Counter";
CREATE UNIQUE INDEX "Counter_id_key" ON "Counter"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
