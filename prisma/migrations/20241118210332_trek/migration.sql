-- CreateTable
CREATE TABLE "Favourite" (
    "viewerId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "episodeId" TEXT NOT NULL,

    PRIMARY KEY ("viewerId", "rank"),
    CONSTRAINT "Favourite_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "Viewer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Favourite_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
