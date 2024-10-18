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
    CONSTRAINT "Episode_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Episode" ("abbreviation", "description", "id", "name", "production", "release", "runtime", "season", "seriesId", "sort", "starDate") SELECT "abbreviation", "description", "id", "name", "production", "release", "runtime", "season", "seriesId", "sort", "starDate" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
CREATE UNIQUE INDEX "Episode_seriesId_season_production_key" ON "Episode"("seriesId", "season", "production");
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
    CONSTRAINT "View_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "View_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "View_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_View" ("comment", "createdAtId", "episodeId", "id", "liked", "rating", "spoiler", "viewedOn", "viewerId") SELECT "comment", "createdAtId", "episodeId", "id", "liked", "rating", "spoiler", "viewedOn", "viewerId" FROM "View";
DROP TABLE "View";
ALTER TABLE "new_View" RENAME TO "View";
CREATE UNIQUE INDEX "View_createdAtId_key" ON "View"("createdAtId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
