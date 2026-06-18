-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "polyline" TEXT,
ADD COLUMN     "startLatitude" DOUBLE PRECISION,
ADD COLUMN     "startLongitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ambassador_profiles" ADD COLUMN     "articleContent" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "city" TEXT,
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "inviteCode" TEXT NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "isMichelinPartner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "region" TEXT;

-- AlterTable
ALTER TABLE "cyclists" ALTER COLUMN "stravaTokenExpiresAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "club_event_participants" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "cyclistId" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_events" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discipline" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "departureLabel" TEXT,
    "distance" DOUBLE PRECISION,
    "elevation" DOUBLE PRECISION,
    "level" TEXT,
    "bikeType" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "requiresLicense" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_routes" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "elevationGain" INTEGER NOT NULL,
    "discipline" TEXT NOT NULL,
    "level" TEXT,
    "thumbnailUrl" TEXT,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "club_event_participants_cyclistId_idx" ON "club_event_participants"("cyclistId");

-- CreateIndex
CREATE INDEX "club_event_participants_eventId_idx" ON "club_event_participants"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "club_event_participants_eventId_cyclistId_key" ON "club_event_participants"("eventId", "cyclistId");

-- CreateIndex
CREATE INDEX "club_events_clubId_idx" ON "club_events"("clubId");

-- CreateIndex
CREATE INDEX "club_events_createdById_idx" ON "club_events"("createdById");

-- CreateIndex
CREATE INDEX "club_routes_clubId_idx" ON "club_routes"("clubId");

-- CreateIndex
CREATE INDEX "club_routes_createdById_idx" ON "club_routes"("createdById");

-- CreateIndex
CREATE INDEX "activities_cyclistId_isFeatured_idx" ON "activities"("cyclistId", "isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_inviteCode_key" ON "clubs"("inviteCode");

-- AddForeignKey
ALTER TABLE "club_event_participants" ADD CONSTRAINT "club_event_participants_cyclistId_fkey" FOREIGN KEY ("cyclistId") REFERENCES "cyclists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_event_participants" ADD CONSTRAINT "club_event_participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "club_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_events" ADD CONSTRAINT "club_events_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_events" ADD CONSTRAINT "club_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "cyclists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_routes" ADD CONSTRAINT "club_routes_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_routes" ADD CONSTRAINT "club_routes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "cyclists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

