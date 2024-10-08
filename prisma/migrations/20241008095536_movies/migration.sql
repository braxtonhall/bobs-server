-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "Movie" (
    "tmdbId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "collectionId" INTEGER,
    "imdbId" TEXT,
    "posterPath" TEXT,
    "tagline" TEXT,
    "backdropPath" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "languageId" TEXT NOT NULL,
    CONSTRAINT "Movie_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Screener" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "runtime" INTEGER NOT NULL,
    "director" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "searchedAt" DATETIME,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Screener_tmdbId_fkey" FOREIGN KEY ("tmdbId") REFERENCES "Movie" ("tmdbId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Screening" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "screenerId" TEXT NOT NULL,
    "format" TEXT,
    CONSTRAINT "Screening_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Screening_screenerId_fkey" FOREIGN KEY ("screenerId") REFERENCES "Screener" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT,
    "time" DATETIME NOT NULL,
    "productionId" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    CONSTRAINT "Event_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Production" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theatreId" TEXT NOT NULL,
    CONSTRAINT "Production_theatreId_fkey" FOREIGN KEY ("theatreId") REFERENCES "Theatre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Theatre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    CONSTRAINT "Theatre_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "City" (
    "name" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "_LanguageToMovie" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_LanguageToMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Language" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_LanguageToMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "Movie" ("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_LanguageToScreening" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_LanguageToScreening_A_fkey" FOREIGN KEY ("A") REFERENCES "Language" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_LanguageToScreening_B_fkey" FOREIGN KEY ("B") REFERENCES "Screening" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Screener_name_year_runtime_director_language_key" ON "Screener"("name", "year", "runtime", "director", "language");

-- CreateIndex
CREATE UNIQUE INDEX "Screening_eventId_screenerId_key" ON "Screening"("eventId", "screenerId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_productionId_time_key" ON "Event"("productionId", "time");

-- CreateIndex
CREATE UNIQUE INDEX "Production_theatreId_name_url_key" ON "Production"("theatreId", "name", "url");

-- CreateIndex
CREATE UNIQUE INDEX "Theatre_url_key" ON "Theatre"("url");

-- CreateIndex
CREATE UNIQUE INDEX "_LanguageToMovie_AB_unique" ON "_LanguageToMovie"("A", "B");

-- CreateIndex
CREATE INDEX "_LanguageToMovie_B_index" ON "_LanguageToMovie"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_LanguageToScreening_AB_unique" ON "_LanguageToScreening"("A", "B");

-- CreateIndex
CREATE INDEX "_LanguageToScreening_B_index" ON "_LanguageToScreening"("B");