-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "charteSignature" TEXT,
ADD COLUMN     "charteSignedAt" TIMESTAMP(3),
ADD COLUMN     "charteSignee" BOOLEAN NOT NULL DEFAULT false;
