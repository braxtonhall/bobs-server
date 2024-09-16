/*
  Warnings:

  - The primary key for the `Movie` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `tmdbId` on the `Movie` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `tmdbId` on the `Screener` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `B` on the `_LanguageToMovie` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Added the required column `collectionId` to the `Movie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imdbId` to the `Movie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `languageId` to the `Movie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `posterPath` to the `Movie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tagline` to the `Movie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Movie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Movie` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Movie" (
    "tmdbId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "collectionId" INTEGER NOT NULL,
    "imdbId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "posterPath" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "languageId" TEXT NOT NULL,
    CONSTRAINT "Movie_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Movie" ("tmdbId") SELECT "tmdbId" FROM "Movie";
DROP TABLE "Movie";
ALTER TABLE "new_Movie" RENAME TO "Movie";
CREATE TABLE "new_Screener" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "runtime" INTEGER NOT NULL,
    "director" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "searchedAt" DATETIME,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Screener_tmdbId_fkey" FOREIGN KEY ("tmdbId") REFERENCES "Movie" ("tmdbId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Screener" ("director", "id", "name", "runtime", "tmdbId", "year") SELECT "director", "id", "name", "runtime", "tmdbId", "year" FROM "Screener";
DROP TABLE "Screener";
ALTER TABLE "new_Screener" RENAME TO "Screener";
CREATE UNIQUE INDEX "Screener_name_year_runtime_director_key" ON "Screener"("name", "year", "runtime", "director");
CREATE TABLE "new__LanguageToMovie" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_LanguageToMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Language" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_LanguageToMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "Movie" ("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__LanguageToMovie" ("A", "B") SELECT "A", "B" FROM "_LanguageToMovie";
DROP TABLE "_LanguageToMovie";
ALTER TABLE "new__LanguageToMovie" RENAME TO "_LanguageToMovie";
CREATE UNIQUE INDEX "_LanguageToMovie_AB_unique" ON "_LanguageToMovie"("A", "B");
CREATE INDEX "_LanguageToMovie_B_index" ON "_LanguageToMovie"("B");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
