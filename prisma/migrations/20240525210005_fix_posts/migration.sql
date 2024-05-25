/*
  Warnings:

  - The primary key for the `Post` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `Post` table. All the data in the column will be lost.
  - Added the required column `sort` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "sort" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from" TEXT NOT NULL,
    "dead" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "posterId" INTEGER NOT NULL,
    "emailId" TEXT,
    "boxId" TEXT NOT NULL,
    "parentId" TEXT,
    CONSTRAINT "Post_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "Poster" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Post_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Post_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Post_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("boxId", "content", "createdAt", "dead", "emailId", "from", "id", "parentId", "posterId", "subscribed") SELECT "boxId", "content", "createdAt", "dead", "emailId", "from", "id", "parentId", "posterId", "subscribed" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE UNIQUE INDEX "Post_id_key" ON "Post"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
