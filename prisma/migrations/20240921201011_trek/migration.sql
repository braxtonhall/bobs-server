-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Episode" (
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "runtime" INTEGER NOT NULL,
    "release" DATETIME NOT NULL,
    "starDate" REAL,
    "season" INTEGER NOT NULL,
    "production" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "bobsSort" INTEGER NOT NULL,

    PRIMARY KEY ("seriesId", "season", "production"),
    CONSTRAINT "Episode_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Viewer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Viewer_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "View" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "viewerId" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "production" INTEGER NOT NULL,
    "opinion" BOOLEAN,
    "comment" TEXT,
    "rewatch" BOOLEAN NOT NULL,
    "viewedOn" DATETIME,
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "View_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "View_seriesId_season_production_fkey" FOREIGN KEY ("seriesId", "season", "production") REFERENCES "Episode" ("seriesId", "season", "production") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Viewer_emailId_key" ON "Viewer"("emailId");
