/*
  Warnings:

  - A unique constraint covering the columns `[watchlistId,episodeId]` on the table `WatchlistEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WatchlistEntry_watchlistId_episodeId_key" ON "WatchlistEntry"("watchlistId", "episodeId");
