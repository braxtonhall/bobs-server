-- CreateTable
CREATE TABLE "Permission" (
    "boxId" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "canSetDetails" BOOLEAN NOT NULL DEFAULT false,
    "canKill" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canSetPermissions" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("boxId", "emailId"),
    CONSTRAINT "Permission_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Permission_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
