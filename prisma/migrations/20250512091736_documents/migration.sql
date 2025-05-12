-- CreateTable
CREATE TABLE "Document" (
    "sort" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "origin" TEXT,
    "ownerId" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL,
    CONSTRAINT "Document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Email" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collaboration" (
    "documentId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,

    PRIMARY KEY ("documentId", "emailId"),
    CONSTRAINT "Collaboration_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Collaboration_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_id_key" ON "Document"("id");
