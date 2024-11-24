-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAtId" INTEGER,
    CONSTRAINT "Watchlist_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Viewer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Watchlist_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Watchlist" ("createdAtId", "description", "id", "name", "ownerId") SELECT "createdAtId", "description", "id", "name", "ownerId" FROM "Watchlist";
DROP TABLE "Watchlist";
ALTER TABLE "new_Watchlist" RENAME TO "Watchlist";
CREATE UNIQUE INDEX "Watchlist_createdAtId_key" ON "Watchlist"("createdAtId");
CREATE TABLE "new_WatchlistLike" (
    "viewerId" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "createdAtId" INTEGER NOT NULL,

    PRIMARY KEY ("viewerId", "watchlistId"),
    CONSTRAINT "WatchlistLike_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WatchlistLike_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WatchlistLike_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WatchlistLike" ("createdAtId", "viewerId", "watchlistId") SELECT "createdAtId", "viewerId", "watchlistId" FROM "WatchlistLike";
DROP TABLE "WatchlistLike";
ALTER TABLE "new_WatchlistLike" RENAME TO "WatchlistLike";
CREATE UNIQUE INDEX "WatchlistLike_createdAtId_key" ON "WatchlistLike"("createdAtId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
