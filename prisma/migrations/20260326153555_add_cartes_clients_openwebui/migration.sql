-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "astroData" JSONB,
ADD COLUMN     "baziData" JSONB,
ADD COLUMN     "birthCity" TEXT,
ADD COLUMN     "birthCountry" TEXT,
ADD COLUMN     "birthLat" DOUBLE PRECISION,
ADD COLUMN     "birthLng" DOUBLE PRECISION,
ADD COLUMN     "birthTime" TEXT,
ADD COLUMN     "cartesGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "hdFullData" JSONB,
ADD COLUMN     "numerologyData" JSONB;

-- CreateTable
CREATE TABLE "OpenWebuiQueue" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "OpenWebuiQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SabianSymbol" (
    "id" INTEGER NOT NULL,
    "degree" INTEGER NOT NULL,
    "sign" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "keynote" TEXT NOT NULL,

    CONSTRAINT "SabianSymbol_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OpenWebuiQueue" ADD CONSTRAINT "OpenWebuiQueue_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
