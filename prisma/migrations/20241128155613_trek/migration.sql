-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TrekSeason" (
    "seriesId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,

    PRIMARY KEY ("seriesId", "number"),
    CONSTRAINT "TrekSeason_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "runtime" INTEGER NOT NULL,
    "release" TEXT NOT NULL,
    "starDate" REAL,
    "season" INTEGER NOT NULL,
    "production" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    CONSTRAINT "Episode_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Episode_seriesId_season_fkey" FOREIGN KEY ("seriesId", "season") REFERENCES "TrekSeason" ("seriesId", "number") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAtId" INTEGER,
    CONSTRAINT "Watchlist_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Viewer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Watchlist_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WatchlistEntry" (
    "watchlistId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "episodeId" TEXT NOT NULL,

    PRIMARY KEY ("watchlistId", "rank"),
    CONSTRAINT "WatchlistEntry_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchlistEntry_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Viewer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "gravatar" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "about" TEXT NOT NULL DEFAULT '',
    "createdAtId" INTEGER NOT NULL,
    "colours" TEXT NOT NULL DEFAULT '{}',
    "isSpoilerEpisodeName" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodePicture" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodeDescription" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodeReviewComment" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodeReviewScore" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodeReviewCommentSpoilerTag" BOOLEAN NOT NULL DEFAULT true,
    "isSpoilerEpisodeRating" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Viewer_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Viewer_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Favourite" (
    "viewerId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "episodeId" TEXT NOT NULL,

    PRIMARY KEY ("viewerId", "rank"),
    CONSTRAINT "Favourite_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favourite_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Viewing" (
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

-- CreateTable
CREATE TABLE "WatchlistLike" (
    "viewerId" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "createdAtId" INTEGER NOT NULL,

    PRIMARY KEY ("viewerId", "watchlistId"),
    CONSTRAINT "WatchlistLike_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchlistLike_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WatchlistLike_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Opinion" (
    "viewerId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL,
    "rating" INTEGER,

    PRIMARY KEY ("viewerId", "episodeId"),
    CONSTRAINT "Opinion_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Opinion_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "View" (
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

-- CreateTable
CREATE TABLE "ViewLike" (
    "viewerId" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "createdAtId" INTEGER NOT NULL,

    PRIMARY KEY ("viewerId", "viewId"),
    CONSTRAINT "ViewLike_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewLike_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewLike_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Follow" (
    "followerId" TEXT NOT NULL,
    "followedId" TEXT NOT NULL,
    "createdAtId" INTEGER NOT NULL,

    PRIMARY KEY ("followerId", "followedId"),
    CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "Viewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Follow_followedId_fkey" FOREIGN KEY ("followedId") REFERENCES "Viewer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Follow_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "name" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "_TagToView" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TagToView_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag" ("name") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TagToView_B_fkey" FOREIGN KEY ("B") REFERENCES "View" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TagToWatchlist" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TagToWatchlist_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag" ("name") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TagToWatchlist_B_fkey" FOREIGN KEY ("B") REFERENCES "Watchlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seriesId_season_production_key" ON "Episode"("seriesId", "season", "production");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_createdAtId_key" ON "Watchlist"("createdAtId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistEntry_watchlistId_episodeId_key" ON "WatchlistEntry"("watchlistId", "episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Viewer_emailId_key" ON "Viewer"("emailId");

-- CreateIndex
CREATE UNIQUE INDEX "Viewer_createdAtId_key" ON "Viewer"("createdAtId");

-- CreateIndex
CREATE UNIQUE INDEX "Viewing_startedAtId_key" ON "Viewing"("startedAtId");

-- CreateIndex
CREATE UNIQUE INDEX "Viewing_finishedAtId_key" ON "Viewing"("finishedAtId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistLike_createdAtId_key" ON "WatchlistLike"("createdAtId");

-- CreateIndex
CREATE UNIQUE INDEX "View_createdAtId_key" ON "View"("createdAtId");

-- CreateIndex
CREATE UNIQUE INDEX "ViewLike_createdAtId_key" ON "ViewLike"("createdAtId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_createdAtId_key" ON "Follow"("createdAtId");

-- CreateIndex
CREATE UNIQUE INDEX "_TagToView_AB_unique" ON "_TagToView"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToView_B_index" ON "_TagToView"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TagToWatchlist_AB_unique" ON "_TagToWatchlist"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToWatchlist_B_index" ON "_TagToWatchlist"("B");
