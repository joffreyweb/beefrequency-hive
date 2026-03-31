-- CreateTable
CREATE TABLE "DetoxDay" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "elixirDone" BOOLEAN NOT NULL DEFAULT false,
    "protocolDone" BOOLEAN NOT NULL DEFAULT false,
    "pratiqueDone" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetoxDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DetoxDay_clientId_dayNumber_key" ON "DetoxDay"("clientId", "dayNumber");

-- AddForeignKey
ALTER TABLE "DetoxDay" ADD CONSTRAINT "DetoxDay_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
