-- Authorized retail partners (online shops) selling Michelin bike tires.
-- Non-destructive: new table only.
CREATE TABLE "resellers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resellers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "resellers_website_key" ON "resellers"("website");
CREATE INDEX "resellers_country_idx" ON "resellers"("country");
CREATE INDEX "resellers_region_idx" ON "resellers"("region");

-- Seed the official retail list (reference data, idempotent on website).
INSERT INTO "resellers" ("id", "name", "region", "country", "website", "updatedAt") VALUES
    (gen_random_uuid(), 'Tredz',           'EUN', 'UK', 'https://www.tredz.co.uk',          CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Biketart',        'EUN', 'UK', 'https://www.biketart.com',         CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Evans Cycles',    'EUN', 'UK', 'https://www.evanscycles.com',      CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Bike24',          'EUN', 'DE', 'https://www.bike24.com',           CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Bike-Components', 'EUN', 'DE', 'https://www.bike-components.de',    CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Amazon',          'EUN', 'DE', 'https://www.amazon.de',            CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Deporvillage',    'EUS', 'ES', 'https://www.deporvillage.com',     CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'FuturumShop',     'EUS', 'NL', 'https://www.futurumshop.nl',       CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'LordGun',         'EUS', 'IT', 'https://www.lordgunbicycles.com',  CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Centrum Rowerowe','ECA', 'PL', 'https://www.centrumrowerowe.pl',   CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Bikeinn',         'EUS', 'ES', 'https://www.bikeinn.com',          CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Van Eyck Sports', 'EUS', 'BE', 'https://www.vaneycksports.be',     CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Probikeshop',     'EUS', 'FR', 'https://www.probikeshop.fr',       CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Alltricks',       'EUS', 'FR', 'https://www.alltricks.fr',         CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Materiel-Velo',   'EUS', 'FR', 'https://www.materiel-velo.com',    CURRENT_TIMESTAMP)
ON CONFLICT ("website") DO NOTHING;
