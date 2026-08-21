
-- DropForeignKey
ALTER TABLE "Clase" DROP CONSTRAINT "Clase_carreraId_fkey";

-- AlterTable
ALTER TABLE "Clase" ALTER COLUMN "carreraId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Clase" ADD CONSTRAINT "Clase_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

