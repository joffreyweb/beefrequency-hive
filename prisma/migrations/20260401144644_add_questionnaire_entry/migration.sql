-- CreateTable
CREATE TABLE "QuestionnaireEntry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sectionsDone" INTEGER NOT NULL DEFAULT 0,
    "responses" JSONB,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireEntry_clientId_key" ON "QuestionnaireEntry"("clientId");

-- AddForeignKey
ALTER TABLE "QuestionnaireEntry" ADD CONSTRAINT "QuestionnaireEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
