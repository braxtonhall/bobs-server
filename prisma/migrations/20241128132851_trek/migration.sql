-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "gravatar" TEXT
);
INSERT INTO "new_Email" ("address", "confirmed", "gravatar", "id", "subscribed") SELECT "address", "confirmed", "gravatar", "id", "subscribed" FROM "Email";
DROP TABLE "Email";
ALTER TABLE "new_Email" RENAME TO "Email";
CREATE UNIQUE INDEX "Email_address_key" ON "Email"("address");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
