/*
  Warnings:

  - Added the required column `metadata` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `language` to the `Screener` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT,
    "time" DATETIME NOT NULL,
    "productionId" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    CONSTRAINT "Event_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("id", "productionId", "time", "url") SELECT "id", "productionId", "time", "url" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_productionId_time_key" ON "Event"("productionId", "time");
CREATE TABLE "new_Screener" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "runtime" INTEGER NOT NULL,
    "director" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "searchedAt" DATETIME,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Screener_tmdbId_fkey" FOREIGN KEY ("tmdbId") REFERENCES "Movie" ("tmdbId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Screener" ("director", "id", "name", "runtime", "searchCount", "searchedAt", "tmdbId", "year") SELECT "director", "id", "name", "runtime", "searchCount", "searchedAt", "tmdbId", "year" FROM "Screener";
DROP TABLE "Screener";
ALTER TABLE "new_Screener" RENAME TO "Screener";
CREATE UNIQUE INDEX "Screener_name_year_runtime_director_language_key" ON "Screener"("name", "year", "runtime", "director", "language");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
