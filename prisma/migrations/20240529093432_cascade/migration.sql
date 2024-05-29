-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "playlistEntryId" TEXT NOT NULL,
    CONSTRAINT "Rule_playlistEntryId_fkey" FOREIGN KEY ("playlistEntryId") REFERENCES "Entry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Rule" ("id", "playlistEntryId", "text") SELECT "id", "playlistEntryId", "text" FROM "Rule";
DROP TABLE "Rule";
ALTER TABLE "new_Rule" RENAME TO "Rule";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
