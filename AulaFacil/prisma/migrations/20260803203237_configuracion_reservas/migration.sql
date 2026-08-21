-- CreateTable
CREATE TABLE "ConfiguracionReservas" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "anticipacionMinDias" INTEGER NOT NULL DEFAULT 0,
    "anticipacionMaxDias" INTEGER NOT NULL DEFAULT 30,
    "duracionMaximaMinutos" INTEGER NOT NULL DEFAULT 180,
    "maxReservasSimultaneasPorUsuario" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionReservas_pkey" PRIMARY KEY ("id")
);
