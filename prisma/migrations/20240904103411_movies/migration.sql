-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
INSERT INTO "new_Movie" ("collectionId", "imdbId", "languageId", "posterPath", "tagline", "title", "tmdbId", "updatedAt") SELECT "collectionId", "imdbId", "languageId", "posterPath", "tagline", "title", "tmdbId", "updatedAt" FROM "Movie";
DROP TABLE "Movie";
ALTER TABLE "new_Movie" RENAME TO "Movie";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
