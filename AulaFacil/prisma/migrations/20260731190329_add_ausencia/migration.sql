-- CreateTable
CREATE TABLE "Ausencia" (
    "id" TEXT NOT NULL,
    "horarioId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ausencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ausencia_horarioId_fecha_key" ON "Ausencia"("horarioId", "fecha");

-- AddForeignKey
ALTER TABLE "Ausencia" ADD CONSTRAINT "Ausencia_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "Horario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
