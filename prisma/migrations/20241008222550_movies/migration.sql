/*
  Warnings:

  - Added the required column `ingested` to the `Movie` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "List" (
    "link" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "watchlist" BOOLEAN NOT NULL,
    "owner" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ListEntry" (
    "listLink" TEXT NOT NULL,
    "movieSlug" TEXT NOT NULL,
    "index" INTEGER,

    PRIMARY KEY ("listLink", "movieSlug"),
    CONSTRAINT "ListEntry_listLink_fkey" FOREIGN KEY ("listLink") REFERENCES "List" ("link") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ListEntry_movieSlug_fkey" FOREIGN KEY ("movieSlug") REFERENCES "LetterboxdMovie" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LetterboxdMovie" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "tmdbId" INTEGER
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Movie" (
    "tmdbId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ingested" BOOLEAN NOT NULL,
    "title" TEXT,
    "collectionId" INTEGER,
    "imdbId" TEXT,
    "posterPath" TEXT,
    "tagline" TEXT,
    "backdropPath" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "languageId" TEXT,
    CONSTRAINT "Movie_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Movie" ("backdropPath", "collectionId", "imdbId", "languageId", "posterPath", "tagline", "title", "tmdbId", "updatedAt") SELECT "backdropPath", "collectionId", "imdbId", "languageId", "posterPath", "tagline", "title", "tmdbId", "updatedAt" FROM "Movie";
DROP TABLE "Movie";
ALTER TABLE "new_Movie" RENAME TO "Movie";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
