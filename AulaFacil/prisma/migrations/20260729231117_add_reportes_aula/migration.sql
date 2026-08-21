-- CreateEnum
CREATE TYPE "EstadoReporte" AS ENUM ('PENDIENTE', 'RESUELTO');

-- CreateTable
CREATE TABLE "ReporteAula" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoReporte" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaAt" TIMESTAMP(3),

    CONSTRAINT "ReporteAula_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReporteAula" ADD CONSTRAINT "ReporteAula_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteAula" ADD CONSTRAINT "ReporteAula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
