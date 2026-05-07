-- CreateTable
CREATE TABLE "CrdtDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'private',
    "snapshot" BLOB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrdtDocument_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrdtOperation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" TEXT NOT NULL,
    "update" BLOB NOT NULL,
    CONSTRAINT "CrdtOperation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CrdtDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
