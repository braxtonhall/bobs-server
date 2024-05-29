/*
  Warnings:

  - You are about to drop the `Stylesheet` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Box" ADD COLUMN "stylesheets" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Stylesheet";
PRAGMA foreign_keys=on;
