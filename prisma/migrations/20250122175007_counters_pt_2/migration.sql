/*
  Warnings:

  - You are about to drop the column `count` on the `Counter` table. All the data in the column will be lost.
  - You are about to drop the column `count` on the `CounterView` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Action" (
    "sort" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "counterId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "unique" BOOLEAN NOT NULL,
    "behaviour" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "colorR" INTEGER NOT NULL,
    "colorG" INTEGER NOT NULL,
    "colorB" INTEGER NOT NULL,
    "colorA" INTEGER NOT NULL,
    "backgroundColorR" INTEGER NOT NULL,
    "backgroundColorG" INTEGER NOT NULL,
    "backgroundColorB" INTEGER NOT NULL,
    "backgroundColorA" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "textAlign" TEXT NOT NULL,
    "textBaseline" TEXT NOT NULL,
    "fontFamily" TEXT NOT NULL,
    "fontSize" INTEGER NOT NULL,
    "fontStyle" TEXT NOT NULL,
    "fontWeight" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    CONSTRAINT "Action_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "Counter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionView" (
    "actionId" TEXT NOT NULL,
    "posterId" INTEGER NOT NULL,

    PRIMARY KEY ("actionId", "posterId"),
    CONSTRAINT "ActionView_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActionView_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "Poster" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "views" INTEGER NOT NULL DEFAULT 0,
    "value" INTEGER NOT NULL DEFAULT 0,
    "unique" BOOLEAN NOT NULL,
    CONSTRAINT "Counter_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Counter" ("deleted", "id", "name", "origin", "ownerId", "sort", "unique") SELECT "deleted", "id", "name", "origin", "ownerId", "sort", "unique" FROM "Counter";
DROP TABLE "Counter";
ALTER TABLE "new_Counter" RENAME TO "Counter";
CREATE UNIQUE INDEX "Counter_id_key" ON "Counter"("id");
CREATE TABLE "new_CounterView" (
    "counterId" TEXT NOT NULL,
    "posterId" INTEGER NOT NULL,

    PRIMARY KEY ("counterId", "posterId"),
    CONSTRAINT "CounterView_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "Counter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CounterView_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "Poster" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CounterView" ("counterId", "posterId") SELECT "counterId", "posterId" FROM "CounterView";
DROP TABLE "CounterView";
ALTER TABLE "new_CounterView" RENAME TO "CounterView";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Action_id_key" ON "Action"("id");
