-- CreateTable
CREATE TABLE "DayMessage" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DayMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientMessageSeen" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientMessageSeen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientMessageSeen_clientId_messageId_key" ON "ClientMessageSeen"("clientId", "messageId");

-- AddForeignKey
ALTER TABLE "ClientMessageSeen" ADD CONSTRAINT "ClientMessageSeen_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientMessageSeen" ADD CONSTRAINT "ClientMessageSeen_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DayMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
