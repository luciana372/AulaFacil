-- DropForeignKey
ALTER TABLE "Inscripcion" DROP CONSTRAINT "Inscripcion_alumnoId_fkey";

-- DropForeignKey
ALTER TABLE "Inscripcion" DROP CONSTRAINT "Inscripcion_claseId_fkey";

-- AlterTable
ALTER TABLE "Clase" ADD COLUMN     "carreraId" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "carreraId" TEXT;

-- DropTable
DROP TABLE "Inscripcion";

-- CreateTable
CREATE TABLE "Carrera" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Carrera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recordatorio" (
    "id" TEXT NOT NULL,
    "alumnoId" TEXT NOT NULL,
    "horarioId" TEXT NOT NULL,
    "minutosAntes" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recordatorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordatorioEnviado" (
    "id" TEXT NOT NULL,
    "recordatorioId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordatorioEnviado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Carrera_nombre_key" ON "Carrera"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Recordatorio_alumnoId_horarioId_key" ON "Recordatorio"("alumnoId", "horarioId");

-- CreateIndex
CREATE UNIQUE INDEX "RecordatorioEnviado_recordatorioId_fecha_key" ON "RecordatorioEnviado"("recordatorioId", "fecha");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clase" ADD CONSTRAINT "Clase_carreraId_fkey" FOREIGN KEY ("carreraId") REFERENCES "Carrera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recordatorio" ADD CONSTRAINT "Recordatorio_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recordatorio" ADD CONSTRAINT "Recordatorio_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "Horario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordatorioEnviado" ADD CONSTRAINT "RecordatorioEnviado_recordatorioId_fkey" FOREIGN KEY ("recordatorioId") REFERENCES "Recordatorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

