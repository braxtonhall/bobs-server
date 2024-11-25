/*
  Warnings:

  - You are about to drop the `_EpisodeToWatchlist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_EpisodeToWatchlist";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "WatchlistEntry" (
    "watchlistId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "episodeId" TEXT NOT NULL,

    PRIMARY KEY ("watchlistId", "rank"),
    CONSTRAINT "WatchlistEntry_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchlistEntry_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
