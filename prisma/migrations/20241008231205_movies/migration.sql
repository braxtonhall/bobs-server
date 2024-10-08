/*
  Warnings:

  - You are about to drop the column `owner` on the `List` table. All the data in the column will be lost.
  - You are about to drop the column `watchlist` on the `List` table. All the data in the column will be lost.
  - You are about to drop the column `ingested` on the `Movie` table. All the data in the column will be lost.
  - Made the column `name` on table `List` required. This step will fail if there are existing NULL values in that column.
  - Made the column `languageId` on table `Movie` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `Movie` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_List" (
    "link" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_List" ("link", "name", "updatedAt") SELECT "link", "name", "updatedAt" FROM "List";
DROP TABLE "List";
ALTER TABLE "new_List" RENAME TO "List";
CREATE TABLE "new_Movie" (
    "tmdbId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "collectionId" INTEGER,
    "imdbId" TEXT,
    "posterPath" TEXT,
    "tagline" TEXT,
    "backdropPath" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "languageId" TEXT NOT NULL,
    CONSTRAINT "Movie_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Movie" ("backdropPath", "collectionId", "imdbId", "languageId", "posterPath", "tagline", "title", "tmdbId", "updatedAt") SELECT "backdropPath", "collectionId", "imdbId", "languageId", "posterPath", "tagline", "title", "tmdbId", "updatedAt" FROM "Movie";
DROP TABLE "Movie";
ALTER TABLE "new_Movie" RENAME TO "Movie";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
