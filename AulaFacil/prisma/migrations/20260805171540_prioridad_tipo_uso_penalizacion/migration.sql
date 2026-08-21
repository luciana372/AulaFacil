-- CreateEnum
CREATE TYPE "TipoUso" AS ENUM ('CATEDRA', 'INVESTIGACION', 'LIBRE');

-- AlterTable
ALTER TABLE "Solicitud" ADD COLUMN     "tipoUso" "TipoUso" NOT NULL DEFAULT 'CATEDRA';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "penalizadoHasta" TIMESTAMP(3);
