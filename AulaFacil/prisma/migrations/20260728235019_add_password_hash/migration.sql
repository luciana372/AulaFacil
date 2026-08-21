-- AlterTable: add as nullable first so existing rows aren't broken
ALTER TABLE "Usuario" ADD COLUMN     "passwordHash" TEXT;

-- Backfill existing seed/dev rows with the dev password ("password123") hash
UPDATE "Usuario" SET "passwordHash" = '$2b$10$HkIj1hmZdkTnmN87EtDGqOFsL1hdgXkHiFHvj2pNrsKeUXXt4Uzqe' WHERE "passwordHash" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "Usuario" ALTER COLUMN "passwordHash" SET NOT NULL;
