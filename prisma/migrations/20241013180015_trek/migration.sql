/*
  Warnings:

  - You are about to drop the column `currentId` on the `Viewer` table. All the data in the column will be lost.
  - You are about to drop the column `watchingId` on the `Viewer` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Viewing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewerId" TEXT NOT NULL,
    "cursor" TEXT,
    "watchlistId" TEXT NOT NULL,
    CONSTRAINT "Viewing_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Viewing_cursor_fkey" FOREIGN KEY ("cursor") REFERENCES "Episode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Viewing_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "viewerId" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,

    PRIMARY KEY ("viewerId", "watchlistId"),
    CONSTRAINT "Bookmark_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bookmark_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Watchlist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Viewer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "settings" TEXT NOT NULL,
    CONSTRAINT "Viewer_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Viewer" ("emailId", "id", "name", "settings") SELECT "emailId", "id", "name", "settings" FROM "Viewer";
DROP TABLE "Viewer";
ALTER TABLE "new_Viewer" RENAME TO "Viewer";
CREATE UNIQUE INDEX "Viewer_emailId_key" ON "Viewer"("emailId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
