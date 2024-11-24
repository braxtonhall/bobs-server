-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Follow" (
    "followerId" TEXT NOT NULL,
    "followedId" TEXT NOT NULL,
    "createdAtId" INTEGER NOT NULL,

    PRIMARY KEY ("followerId", "followedId"),
    CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "Viewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Follow_followedId_fkey" FOREIGN KEY ("followedId") REFERENCES "Viewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Follow_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Follow" ("createdAtId", "followedId", "followerId") SELECT "createdAtId", "followedId", "followerId" FROM "Follow";
DROP TABLE "Follow";
ALTER TABLE "new_Follow" RENAME TO "Follow";
CREATE UNIQUE INDEX "Follow_createdAtId_key" ON "Follow"("createdAtId");
CREATE TABLE "new_View" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewerId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "spoiler" BOOLEAN NOT NULL,
    "viewedOn" TEXT,
    "createdAtId" INTEGER NOT NULL,
    CONSTRAINT "View_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "View_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "View_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_View" ("comment", "createdAtId", "episodeId", "id", "liked", "rating", "spoiler", "viewedOn", "viewerId") SELECT "comment", "createdAtId", "episodeId", "id", "liked", "rating", "spoiler", "viewedOn", "viewerId" FROM "View";
DROP TABLE "View";
ALTER TABLE "new_View" RENAME TO "View";
CREATE UNIQUE INDEX "View_createdAtId_key" ON "View"("createdAtId");
CREATE TABLE "new_ViewLike" (
    "viewerId" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "createdAtId" INTEGER NOT NULL,

    PRIMARY KEY ("viewerId", "viewId"),
    CONSTRAINT "ViewLike_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewLike_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewLike_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ViewLike" ("createdAtId", "viewId", "viewerId") SELECT "createdAtId", "viewId", "viewerId" FROM "ViewLike";
DROP TABLE "ViewLike";
ALTER TABLE "new_ViewLike" RENAME TO "ViewLike";
CREATE UNIQUE INDEX "ViewLike_createdAtId_key" ON "ViewLike"("createdAtId");
CREATE TABLE "new_Viewing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "state" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "cursor" TEXT,
    "watchlistId" TEXT NOT NULL,
    "startedAtId" INTEGER NOT NULL,
    "finishedAtId" INTEGER,
    CONSTRAINT "Viewing_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Viewing_cursor_fkey" FOREIGN KEY ("cursor") REFERENCES "Episode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Viewing_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Viewing_startedAtId_fkey" FOREIGN KEY ("startedAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Viewing_finishedAtId_fkey" FOREIGN KEY ("finishedAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Viewing" ("cursor", "finishedAtId", "id", "startedAtId", "state", "viewerId", "watchlistId") SELECT "cursor", "finishedAtId", "id", "startedAtId", "state", "viewerId", "watchlistId" FROM "Viewing";
DROP TABLE "Viewing";
ALTER TABLE "new_Viewing" RENAME TO "Viewing";
CREATE UNIQUE INDEX "Viewing_startedAtId_key" ON "Viewing"("startedAtId");
CREATE UNIQUE INDEX "Viewing_finishedAtId_key" ON "Viewing"("finishedAtId");
CREATE TABLE "new_Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAtId" INTEGER,
    CONSTRAINT "Watchlist_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Viewer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Watchlist_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "WatchlistLike_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchlistLike_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchlistLike_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WatchlistLike" ("createdAtId", "viewerId", "watchlistId") SELECT "createdAtId", "viewerId", "watchlistId" FROM "WatchlistLike";
DROP TABLE "WatchlistLike";
ALTER TABLE "new_WatchlistLike" RENAME TO "WatchlistLike";
CREATE UNIQUE INDEX "WatchlistLike_createdAtId_key" ON "WatchlistLike"("createdAtId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
