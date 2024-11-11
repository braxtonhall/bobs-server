-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_List" (
    "link" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "watchlist" BOOLEAN,
    "owner" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_List" ("link", "name", "owner", "updatedAt", "watchlist") SELECT "link", "name", "owner", "updatedAt", "watchlist" FROM "List";
DROP TABLE "List";
ALTER TABLE "new_List" RENAME TO "List";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
