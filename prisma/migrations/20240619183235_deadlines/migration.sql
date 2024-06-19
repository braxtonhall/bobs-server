-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Season" (
    "sort" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ruleCount" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'sign-up',
    "softDeadline" DATETIME,
    "hardDeadline" DATETIME,
    "remindedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlisted" BOOLEAN NOT NULL DEFAULT false,
    "boxId" TEXT NOT NULL,
    CONSTRAINT "Season_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Season_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Season" ("boxId", "description", "id", "name", "ownerId", "ruleCount", "sort", "state", "unlisted") SELECT "boxId", "description", "id", "name", "ownerId", "ruleCount", "sort", "state", "unlisted" FROM "Season";
DROP TABLE "Season";
ALTER TABLE "new_Season" RENAME TO "Season";
CREATE UNIQUE INDEX "Season_id_key" ON "Season"("id");
CREATE UNIQUE INDEX "Season_boxId_key" ON "Season"("boxId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
