-- Migration manually created to sync with database
ALTER TABLE "cyclists" ADD COLUMN "stravaTokenExpiresAt" TIMESTAMP;
