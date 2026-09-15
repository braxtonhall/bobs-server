-- AlterTable
ALTER TABLE "Token" ADD COLUMN "familyId" TEXT;

-- CreateIndex
CREATE INDEX "Token_familyId_idx" ON "Token"("familyId");
