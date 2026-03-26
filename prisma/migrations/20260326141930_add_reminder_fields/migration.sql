-- AlterTable
ALTER TABLE "User" ADD COLUMN     "eveningReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "eveningReminderTime" TEXT NOT NULL DEFAULT '20:00',
ADD COLUMN     "morningReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "morningReminderTime" TEXT NOT NULL DEFAULT '07:00';
