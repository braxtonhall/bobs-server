/*
  Warnings:

  - You are about to drop the column `production` on the `View` table. All the data in the column will be lost.
  - You are about to drop the column `rewatch` on the `View` table. All the data in the column will be lost.
  - You are about to drop the column `season` on the `View` table. All the data in the column will be lost.
  - You are about to drop the column `seriesId` on the `View` table. All the data in the column will be lost.
  - Added the required column `episodeId` to the `View` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Opinion" (
    "viewerId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "opinion" BOOLEAN,

    PRIMARY KEY ("viewerId", "episodeId"),
    CONSTRAINT "Opinion_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Opinion_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_View" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "viewerId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "opinion" BOOLEAN,
    "comment" TEXT,
    "viewedOn" DATETIME,
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "View_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "View_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_View" ("comment", "createdAt", "id", "opinion", "viewedOn", "viewerId") SELECT "comment", "createdAt", "id", "opinion", "viewedOn", "viewerId" FROM "View";
DROP TABLE "View";
ALTER TABLE "new_View" RENAME TO "View";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
