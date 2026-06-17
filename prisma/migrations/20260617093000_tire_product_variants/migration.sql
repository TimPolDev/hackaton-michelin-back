-- Rework Tire catalog into Product (one per Global ID) -> Variant model.
-- Catalog data is fully re-seeded right after (npm run seed), so clear tire rows
-- to allow adding NOT NULL product columns. CASCADE also clears ambassador_tires
-- (FK -> tires, ON DELETE CASCADE), which the demo seed recreates.
TRUNCATE TABLE "tires" CASCADE;

-- AlterTable
ALTER TABLE "tires" DROP COLUMN "designation",
DROP COLUMN "diameter",
DROP COLUMN "discontinuedDate",
DROP COLUMN "maxPressure",
DROP COLUMN "minPressure",
DROP COLUMN "reinforcementTech",
DROP COLUMN "webProductName",
DROP COLUMN "weight",
DROP COLUMN "width",
ADD COLUMN     "cycleType" TEXT NOT NULL,
ADD COLUMN     "fitting" TEXT,
ADD COLUMN     "minWeight" INTEGER,
ADD COLUMN     "rangeInternal" TEXT NOT NULL,
ADD COLUMN     "rimType" TEXT,
ADD COLUMN     "sealing" TEXT,
ADD COLUMN     "segment" TEXT NOT NULL,
ADD COLUMN     "sidewallType" TEXT,
ADD COLUMN     "treadPatternTech" TEXT;

-- CreateTable
CREATE TABLE "tire_variants" (
    "id" TEXT NOT NULL,
    "tireId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "webProductName" TEXT NOT NULL,
    "bead" TEXT,
    "eanCode" TEXT,
    "widthEtrto" TEXT,
    "diameterEtrto" TEXT,
    "widthMm" INTEGER,
    "diameterMm" INTEGER,
    "weight" INTEGER,
    "minPressure" DOUBLE PRECISION,
    "maxPressure" DOUBLE PRECISION,
    "tpi" TEXT,
    "terrainTypes" TEXT NOT NULL,
    "reinforcementTech" TEXT,
    "sidewallColor" TEXT,
    "treadPatternColor" TEXT,
    "recommendedInnerTube" TEXT,
    "discontinuedDate" TIMESTAMP(3),
    "isDiscontinued" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tire_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tire_variants_tireId_idx" ON "tire_variants"("tireId");

-- AddForeignKey
ALTER TABLE "tire_variants" ADD CONSTRAINT "tire_variants_tireId_fkey" FOREIGN KEY ("tireId") REFERENCES "tires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

