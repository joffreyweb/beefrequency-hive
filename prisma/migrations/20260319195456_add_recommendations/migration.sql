-- CreateEnum
CREATE TYPE "RecommendationCategory" AS ENUM ('EAU', 'COMPLEMENTS', 'OUTILS', 'SOINS', 'APITHERAPIE', 'AUTRE');

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" "RecommendationCategory" NOT NULL,
    "imageUrl" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientRecommendation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientRecommendation_clientId_recommendationId_key" ON "ClientRecommendation"("clientId", "recommendationId");

-- AddForeignKey
ALTER TABLE "ClientRecommendation" ADD CONSTRAINT "ClientRecommendation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRecommendation" ADD CONSTRAINT "ClientRecommendation_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
