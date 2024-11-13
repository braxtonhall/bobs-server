-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "isSpoilerEpisodeRating" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Viewer_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Viewer_createdAtId_fkey" FOREIGN KEY ("createdAtId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Viewer" ("colours", "createdAtId", "emailId", "id", "isSpoilerEpisodeDescription", "isSpoilerEpisodeName", "isSpoilerEpisodePicture", "isSpoilerEpisodeReview", "isSpoilerEpisodeReviewSpoilerTag", "name") SELECT "colours", "createdAtId", "emailId", "id", "isSpoilerEpisodeDescription", "isSpoilerEpisodeName", "isSpoilerEpisodePicture", "isSpoilerEpisodeReview", "isSpoilerEpisodeReviewSpoilerTag", "name" FROM "Viewer";
DROP TABLE "Viewer";
ALTER TABLE "new_Viewer" RENAME TO "Viewer";
CREATE UNIQUE INDEX "Viewer_emailId_key" ON "Viewer"("emailId");
CREATE UNIQUE INDEX "Viewer_createdAtId_key" ON "Viewer"("createdAtId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
