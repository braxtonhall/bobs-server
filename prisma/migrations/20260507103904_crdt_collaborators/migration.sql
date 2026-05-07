-- CreateTable
CREATE TABLE "CrdtCollaborator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    CONSTRAINT "CrdtCollaborator_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CrdtDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CrdtCollaborator_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CrdtCollaborator_documentId_emailId_key" ON "CrdtCollaborator"("documentId", "emailId");
