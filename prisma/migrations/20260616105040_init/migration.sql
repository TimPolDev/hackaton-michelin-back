-- CreateTable
CREATE TABLE "cyclists" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "stravaId" TEXT,
    "stravaAccessToken" TEXT,
    "stravaRefreshToken" TEXT,
    "stravaConnectedAt" TIMESTAMP(3),
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isAmbassador" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cyclists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cyclist_profiles" (
    "id" TEXT NOT NULL,
    "cyclistId" TEXT NOT NULL,
    "practiceStyle" TEXT,
    "preferGrip" INTEGER NOT NULL DEFAULT 5,
    "preferEndurance" INTEGER NOT NULL DEFAULT 5,
    "preferLightness" INTEGER NOT NULL DEFAULT 5,
    "preferVersatility" INTEGER NOT NULL DEFAULT 5,
    "primaryBikeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cyclist_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cyclist_bike_types" (
    "id" TEXT NOT NULL,
    "cyclistId" TEXT NOT NULL,
    "bikeType" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "manualMonthlyDistance" DOUBLE PRECISION,
    "manualElevationGain" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cyclist_bike_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "cyclistId" TEXT NOT NULL,
    "stravaId" TEXT,
    "bikeType" TEXT NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "elevationGain" DOUBLE PRECISION NOT NULL,
    "movingTime" INTEGER NOT NULL,
    "averageSpeed" DOUBLE PRECISION,
    "terrainAsphalt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "terrainOffroad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "terrainMixed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weatherCondition" TEXT,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tires" (
    "id" TEXT NOT NULL,
    "globalId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "rangeName" TEXT NOT NULL,
    "webProductName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "compatibleBikeTypes" TEXT NOT NULL,
    "useCases" TEXT NOT NULL,
    "terrainTypes" TEXT NOT NULL,
    "rubberTech" TEXT,
    "casingTech" TEXT,
    "reinforcementTech" TEXT,
    "width" INTEGER,
    "diameter" INTEGER,
    "weight" INTEGER,
    "minPressure" DOUBLE PRECISION,
    "maxPressure" DOUBLE PRECISION,
    "isEBikeReady" BOOLEAN NOT NULL DEFAULT false,
    "isDiscontinued" BOOLEAN NOT NULL DEFAULT false,
    "discontinuedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isMultiBikeType" BOOLEAN NOT NULL DEFAULT true,
    "bikeTypeFilter" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_memberships" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "cyclistId" TEXT NOT NULL,
    "isManager" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_invitations" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_profiles" (
    "id" TEXT NOT NULL,
    "cyclistId" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "skillLevel" TEXT NOT NULL,
    "showRidingData" BOOLEAN NOT NULL DEFAULT false,
    "featuredSegments" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassador_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_tires" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "tireId" TEXT NOT NULL,
    "bikeType" TEXT NOT NULL,
    "testimonial" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassador_tires_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cyclists_supabaseUserId_key" ON "cyclists"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "cyclists_email_key" ON "cyclists"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cyclists_stravaId_key" ON "cyclists"("stravaId");

-- CreateIndex
CREATE INDEX "cyclists_supabaseUserId_idx" ON "cyclists"("supabaseUserId");

-- CreateIndex
CREATE INDEX "cyclists_stravaId_idx" ON "cyclists"("stravaId");

-- CreateIndex
CREATE UNIQUE INDEX "cyclist_profiles_cyclistId_key" ON "cyclist_profiles"("cyclistId");

-- CreateIndex
CREATE INDEX "cyclist_bike_types_cyclistId_idx" ON "cyclist_bike_types"("cyclistId");

-- CreateIndex
CREATE UNIQUE INDEX "cyclist_bike_types_cyclistId_bikeType_key" ON "cyclist_bike_types"("cyclistId", "bikeType");

-- CreateIndex
CREATE UNIQUE INDEX "activities_stravaId_key" ON "activities"("stravaId");

-- CreateIndex
CREATE INDEX "activities_cyclistId_bikeType_idx" ON "activities"("cyclistId", "bikeType");

-- CreateIndex
CREATE INDEX "activities_activityDate_idx" ON "activities"("activityDate");

-- CreateIndex
CREATE INDEX "activities_stravaId_idx" ON "activities"("stravaId");

-- CreateIndex
CREATE UNIQUE INDEX "tires_globalId_key" ON "tires"("globalId");

-- CreateIndex
CREATE INDEX "tires_compatibleBikeTypes_idx" ON "tires"("compatibleBikeTypes");

-- CreateIndex
CREATE INDEX "tires_useCases_idx" ON "tires"("useCases");

-- CreateIndex
CREATE INDEX "tires_terrainTypes_idx" ON "tires"("terrainTypes");

-- CreateIndex
CREATE INDEX "clubs_creatorId_idx" ON "clubs"("creatorId");

-- CreateIndex
CREATE INDEX "club_memberships_clubId_idx" ON "club_memberships"("clubId");

-- CreateIndex
CREATE INDEX "club_memberships_cyclistId_idx" ON "club_memberships"("cyclistId");

-- CreateIndex
CREATE UNIQUE INDEX "club_memberships_clubId_cyclistId_key" ON "club_memberships"("clubId", "cyclistId");

-- CreateIndex
CREATE UNIQUE INDEX "club_invitations_token_key" ON "club_invitations"("token");

-- CreateIndex
CREATE INDEX "club_invitations_token_idx" ON "club_invitations"("token");

-- CreateIndex
CREATE INDEX "club_invitations_clubId_idx" ON "club_invitations"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "ambassador_profiles_cyclistId_key" ON "ambassador_profiles"("cyclistId");

-- CreateIndex
CREATE INDEX "ambassador_tires_ambassadorId_idx" ON "ambassador_tires"("ambassadorId");

-- CreateIndex
CREATE INDEX "ambassador_tires_tireId_idx" ON "ambassador_tires"("tireId");

-- CreateIndex
CREATE UNIQUE INDEX "ambassador_tires_ambassadorId_bikeType_key" ON "ambassador_tires"("ambassadorId", "bikeType");

-- AddForeignKey
ALTER TABLE "cyclist_profiles" ADD CONSTRAINT "cyclist_profiles_cyclistId_fkey" FOREIGN KEY ("cyclistId") REFERENCES "cyclists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cyclist_bike_types" ADD CONSTRAINT "cyclist_bike_types_cyclistId_fkey" FOREIGN KEY ("cyclistId") REFERENCES "cyclists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_cyclistId_fkey" FOREIGN KEY ("cyclistId") REFERENCES "cyclists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "cyclists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_cyclistId_fkey" FOREIGN KEY ("cyclistId") REFERENCES "cyclists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_invitations" ADD CONSTRAINT "club_invitations_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_invitations" ADD CONSTRAINT "club_invitations_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "cyclists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_profiles" ADD CONSTRAINT "ambassador_profiles_cyclistId_fkey" FOREIGN KEY ("cyclistId") REFERENCES "cyclists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_tires" ADD CONSTRAINT "ambassador_tires_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ambassador_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_tires" ADD CONSTRAINT "ambassador_tires_tireId_fkey" FOREIGN KEY ("tireId") REFERENCES "tires"("id") ON DELETE CASCADE ON UPDATE CASCADE;
