-- AlterTable
ALTER TABLE "Solicitud" ADD COLUMN     "diasPreferidos" "DiaSemana"[] DEFAULT ARRAY[]::"DiaSemana"[],
ADD COLUMN     "horaFinPreferida" TEXT,
ADD COLUMN     "horaInicioPreferida" TEXT;
