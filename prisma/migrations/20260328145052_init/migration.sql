-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mbid" TEXT,
    "bio" TEXT,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "sourceArtist" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewRelease" (
    "id" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "artistMbid" TEXT,
    "title" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "releaseType" TEXT NOT NULL,
    "mbid" TEXT,
    "coverArtUrl" TEXT,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistImage" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "imageType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_name_key" ON "Artist"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_mbid_key" ON "Artist"("mbid");

-- CreateIndex
CREATE INDEX "Recommendation_createdAt_idx" ON "Recommendation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewRelease_mbid_key" ON "NewRelease"("mbid");

-- CreateIndex
CREATE INDEX "NewRelease_releaseDate_idx" ON "NewRelease"("releaseDate");

-- CreateIndex
CREATE INDEX "NewRelease_playCount_idx" ON "NewRelease"("playCount");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistImage_artistId_imageType_key" ON "ArtistImage"("artistId", "imageType");

-- AddForeignKey
ALTER TABLE "ArtistImage" ADD CONSTRAINT "ArtistImage_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
