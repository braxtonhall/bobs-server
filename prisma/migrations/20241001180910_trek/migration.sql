/*
  Warnings:

  - You are about to drop the column `opinion` on the `Opinion` table. All the data in the column will be lost.
  - You are about to drop the column `opinion` on the `View` table. All the data in the column will be lost.
  - Added the required column `liked` to the `Opinion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `liked` to the `View` table without a default value. This is not possible if the table is not empty.
  - Added the required column `settings` to the `Viewer` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Opinion" (
    "viewerId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL,
    "rating" INTEGER,

    PRIMARY KEY ("viewerId", "episodeId"),
    CONSTRAINT "Opinion_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Opinion_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Opinion" ("episodeId", "viewerId") SELECT "episodeId", "viewerId" FROM "Opinion";
DROP TABLE "Opinion";
ALTER TABLE "new_Opinion" RENAME TO "Opinion";
CREATE TABLE "new_View" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "viewerId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "liked" BOOLEAN NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "viewedOn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "View_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "View_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_View" ("comment", "createdAt", "episodeId", "id", "viewedOn", "viewerId") SELECT "comment", "createdAt", "episodeId", "id", "viewedOn", "viewerId" FROM "View";
DROP TABLE "View";
ALTER TABLE "new_View" RENAME TO "View";
CREATE TABLE "new_Viewer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "watchingId" TEXT,
    "currentId" TEXT,
    "settings" TEXT NOT NULL,
    CONSTRAINT "Viewer_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Viewer_watchingId_fkey" FOREIGN KEY ("watchingId") REFERENCES "Watchlist" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Viewer_currentId_fkey" FOREIGN KEY ("currentId") REFERENCES "Episode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Viewer" ("currentId", "emailId", "id", "name", "watchingId") SELECT "currentId", "emailId", "id", "name", "watchingId" FROM "Viewer";
DROP TABLE "Viewer";
ALTER TABLE "new_Viewer" RENAME TO "Viewer";
CREATE UNIQUE INDEX "Viewer_emailId_key" ON "Viewer"("emailId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
