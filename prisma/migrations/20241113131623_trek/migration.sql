/*
  Warnings:

  - You are about to drop the column `settings` on the `Viewer` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "TrekSeason" (
    "seriesId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,

    PRIMARY KEY ("seriesId", "number"),
    CONSTRAINT "TrekSeason_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Episode" (
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
INSERT INTO "new_Episode" ("abbreviation", "description", "id", "name", "production", "release", "runtime", "season", "seriesId", "sort", "starDate") SELECT "abbreviation", "description", "id", "name", "production", "release", "runtime", "season", "seriesId", "sort", "starDate" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
CREATE UNIQUE INDEX "Episode_seriesId_season_production_key" ON "Episode"("seriesId", "season", "production");
CREATE TABLE "new_Viewer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAtId" INTEGER NOT NULL,
    "colours" TEXT NOT NULL DEFAULT '{}',
    "isSpoilerEpisodeName" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodePicture" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodeDescription" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodeReview" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodeReviewSpoilerTag" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Viewer_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Viewer_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Viewer" ("createdAtId", "emailId", "id", "name") SELECT "createdAtId", "emailId", "id", "name" FROM "Viewer";
DROP TABLE "Viewer";
ALTER TABLE "new_Viewer" RENAME TO "Viewer";
CREATE UNIQUE INDEX "Viewer_emailId_key" ON "Viewer"("emailId");
CREATE UNIQUE INDEX "Viewer_createdAtId_key" ON "Viewer"("createdAtId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
