-- CreateEnum
CREATE TYPE "TipoEquipamiento" AS ENUM ('PROYECTOR', 'PC', 'PIZARRA_DIGITAL');

-- AlterTable
ALTER TABLE "Aula" ADD COLUMN     "equipamiento" "TipoEquipamiento"[] DEFAULT ARRAY[]::"TipoEquipamiento"[];
