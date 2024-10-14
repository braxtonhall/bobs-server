/*
  Warnings:

  - You are about to drop the `Bookmark` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `View` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `state` to the `Viewing` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Bookmark";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "WatchlistLike" (
    "viewerId" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,

    PRIMARY KEY ("viewerId", "watchlistId"),
    CONSTRAINT "WatchlistLike_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WatchlistLike_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ViewLike" (
    "viewerId" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,

    PRIMARY KEY ("viewerId", "viewId"),
    CONSTRAINT "ViewLike_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ViewLike_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_View" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewerId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "spoiler" BOOLEAN NOT NULL,
    "viewedOn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "View_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "View_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_View" ("comment", "createdAt", "episodeId", "id", "liked", "rating", "spoiler", "viewedOn", "viewerId") SELECT "comment", "createdAt", "episodeId", "id", "liked", "rating", "spoiler", "viewedOn", "viewerId" FROM "View";
DROP TABLE "View";
ALTER TABLE "new_View" RENAME TO "View";
CREATE TABLE "new_Viewing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "state" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "cursor" TEXT,
    "watchlistId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "Viewing_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Viewing_cursor_fkey" FOREIGN KEY ("cursor") REFERENCES "Episode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Viewing_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Viewing" ("cursor", "id", "startedAt", "viewerId", "watchlistId") SELECT "cursor", "id", "startedAt", "viewerId", "watchlistId" FROM "Viewing";
DROP TABLE "Viewing";
ALTER TABLE "new_Viewing" RENAME TO "Viewing";
CREATE TABLE "new__TagToView" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TagToView_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag" ("name") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TagToView_B_fkey" FOREIGN KEY ("B") REFERENCES "View" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__TagToView" ("A", "B") SELECT "A", "B" FROM "_TagToView";
DROP TABLE "_TagToView";
ALTER TABLE "new__TagToView" RENAME TO "_TagToView";
CREATE UNIQUE INDEX "_TagToView_AB_unique" ON "_TagToView"("A", "B");
CREATE INDEX "_TagToView_B_index" ON "_TagToView"("B");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
