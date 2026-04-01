-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "entryType" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN     "mediaUrl" TEXT;
