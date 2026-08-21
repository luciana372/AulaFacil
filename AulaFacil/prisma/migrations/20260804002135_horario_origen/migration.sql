-- CreateEnum
CREATE TYPE "OrigenHorario" AS ENUM ('MANUAL', 'OFICIAL');

-- AlterTable
ALTER TABLE "Horario" ADD COLUMN     "origen" "OrigenHorario" NOT NULL DEFAULT 'MANUAL';
