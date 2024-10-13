-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Viewing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewerId" TEXT NOT NULL,
    "cursor" TEXT,
    "watchlistId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Viewing_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Viewing_cursor_fkey" FOREIGN KEY ("cursor") REFERENCES "Episode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Viewing_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Viewing" ("cursor", "id", "viewerId", "watchlistId") SELECT "cursor", "id", "viewerId", "watchlistId" FROM "Viewing";
DROP TABLE "Viewing";
ALTER TABLE "new_Viewing" RENAME TO "Viewing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
