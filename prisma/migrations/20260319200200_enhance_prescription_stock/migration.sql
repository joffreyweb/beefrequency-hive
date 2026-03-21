-- AlterTable
ALTER TABLE "ElixirPrescription" ADD COLUMN     "dailyDose" DOUBLE PRECISION,
ADD COLUMN     "quantity" INTEGER,
ADD COLUMN     "reorderUrl" TEXT,
ADD COLUMN     "stockAlertDays" INTEGER NOT NULL DEFAULT 7;
