-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "temporaryToken" TEXT,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "expiration" DATETIME NOT NULL,
    CONSTRAINT "Token_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Token" ("emailId", "expiration", "id", "temporaryToken", "type", "valid") SELECT "emailId", "expiration", "id", "temporaryToken", "type", "valid" FROM "Token";
DROP TABLE "Token";
ALTER TABLE "new_Token" RENAME TO "Token";
CREATE UNIQUE INDEX "Token_temporaryToken_key" ON "Token"("temporaryToken");
CREATE TABLE "new_Stylesheet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "link" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    CONSTRAINT "Stylesheet_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Stylesheet" ("boxId", "id", "link") SELECT "boxId", "id", "link" FROM "Stylesheet";
DROP TABLE "Stylesheet";
ALTER TABLE "new_Stylesheet" RENAME TO "Stylesheet";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
