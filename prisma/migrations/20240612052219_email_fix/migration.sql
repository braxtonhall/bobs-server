-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Participant_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Participant" ("emailId", "id", "name") SELECT "emailId", "id", "name" FROM "Participant";
DROP TABLE "Participant";
ALTER TABLE "new_Participant" RENAME TO "Participant";
CREATE UNIQUE INDEX "Participant_emailId_key" ON "Participant"("emailId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL COLLATE NOCASE,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "subscribed" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Email" ("address", "confirmed", "id", "subscribed") SELECT "address", "confirmed", "id", "subscribed" FROM "Email";
DROP TABLE "Email";
ALTER TABLE "new_Email" RENAME TO "Email";
CREATE UNIQUE INDEX "Email_address_key" ON "Email"("address");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
