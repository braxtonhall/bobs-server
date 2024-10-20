-- CreateTable
CREATE TABLE "_TagToWatchlist" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TagToWatchlist_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag" ("name") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TagToWatchlist_B_fkey" FOREIGN KEY ("B") REFERENCES "Watchlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "filters" TEXT NOT NULL,
    "createdAtId" INTEGER,
    CONSTRAINT "Watchlist_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Viewer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Watchlist_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Watchlist" ("createdAtId", "description", "filters", "id", "name", "ownerId") SELECT "createdAtId", "description", "filters", "id", "name", "ownerId" FROM "Watchlist";
DROP TABLE "Watchlist";
ALTER TABLE "new_Watchlist" RENAME TO "Watchlist";
CREATE UNIQUE INDEX "Watchlist_createdAtId_key" ON "Watchlist"("createdAtId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_TagToWatchlist_AB_unique" ON "_TagToWatchlist"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToWatchlist_B_index" ON "_TagToWatchlist"("B");
