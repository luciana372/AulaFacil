-- CreateTable
CREATE TABLE "ListaEsperaHorario" (
    "id" TEXT NOT NULL,
    "claseId" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "dia" "DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListaEsperaHorario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListaEsperaHorario_claseId_aulaId_dia_horaInicio_key" ON "ListaEsperaHorario"("claseId", "aulaId", "dia", "horaInicio");

-- AddForeignKey
ALTER TABLE "ListaEsperaHorario" ADD CONSTRAINT "ListaEsperaHorario_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "Clase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListaEsperaHorario" ADD CONSTRAINT "ListaEsperaHorario_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
