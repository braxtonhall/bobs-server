-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LetterboxdMovie" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "tmdbId" INTEGER,
    "searchedAt" DATETIME,
    "searchCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_LetterboxdMovie" ("slug", "tmdbId") SELECT "slug", "tmdbId" FROM "LetterboxdMovie";
DROP TABLE "LetterboxdMovie";
ALTER TABLE "new_LetterboxdMovie" RENAME TO "LetterboxdMovie";
CREATE TABLE "new_ListEntry" (
    "listLink" TEXT NOT NULL,
    "movieSlug" TEXT NOT NULL,
    "index" INTEGER,

    PRIMARY KEY ("listLink", "movieSlug"),
    CONSTRAINT "ListEntry_listLink_fkey" FOREIGN KEY ("listLink") REFERENCES "List" ("link") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListEntry_movieSlug_fkey" FOREIGN KEY ("movieSlug") REFERENCES "LetterboxdMovie" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ListEntry" ("index", "listLink", "movieSlug") SELECT "index", "listLink", "movieSlug" FROM "ListEntry";
DROP TABLE "ListEntry";
ALTER TABLE "new_ListEntry" RENAME TO "ListEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
