/*
  Warnings:

  - You are about to drop the column `filters` on the `Watchlist` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Viewer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "about" TEXT NOT NULL DEFAULT '',
    "createdAtId" INTEGER NOT NULL,
    "colours" TEXT NOT NULL DEFAULT '{}',
    "isSpoilerEpisodeName" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodePicture" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodeDescription" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodeReviewComment" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodeReviewScore" BOOLEAN NOT NULL DEFAULT false,
    "isSpoilerEpisodeReviewCommentSpoilerTag" BOOLEAN NOT NULL DEFAULT true,
    "isSpoilerEpisodeRating" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Viewer_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Viewer_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Viewer" ("colours", "createdAtId", "emailId", "id", "isSpoilerEpisodeDescription", "isSpoilerEpisodeName", "isSpoilerEpisodePicture", "isSpoilerEpisodeRating", "isSpoilerEpisodeReviewComment", "isSpoilerEpisodeReviewCommentSpoilerTag", "isSpoilerEpisodeReviewScore", "name") SELECT "colours", "createdAtId", "emailId", "id", "isSpoilerEpisodeDescription", "isSpoilerEpisodeName", "isSpoilerEpisodePicture", "isSpoilerEpisodeRating", "isSpoilerEpisodeReviewComment", "isSpoilerEpisodeReviewCommentSpoilerTag", "isSpoilerEpisodeReviewScore", "name" FROM "Viewer";
DROP TABLE "Viewer";
ALTER TABLE "new_Viewer" RENAME TO "Viewer";
CREATE UNIQUE INDEX "Viewer_emailId_key" ON "Viewer"("emailId");
CREATE UNIQUE INDEX "Viewer_createdAtId_key" ON "Viewer"("createdAtId");
CREATE TABLE "new_Watchlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAtId" INTEGER,
    CONSTRAINT "Watchlist_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Viewer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Watchlist_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Watchlist" ("createdAtId", "description", "id", "name", "ownerId") SELECT "createdAtId", "description", "id", "name", "ownerId" FROM "Watchlist";
DROP TABLE "Watchlist";
ALTER TABLE "new_Watchlist" RENAME TO "Watchlist";
CREATE UNIQUE INDEX "Watchlist_createdAtId_key" ON "Watchlist"("createdAtId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
