-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OfferType" ADD VALUE 'CONVERSATION_EXPLORATOIRE';
ALTER TYPE "OfferType" ADD VALUE 'SESSION_SEUIL';
ALTER TYPE "OfferType" ADD VALUE 'LE_NECTAR_CYCLE';
ALTER TYPE "OfferType" ADD VALUE 'LE_PASSAGE_1_1';
ALTER TYPE "OfferType" ADD VALUE 'LES_CYCLES_DE_LA_RUCHE';
ALTER TYPE "OfferType" ADD VALUE 'CEREMONIE_RESET';
ALTER TYPE "OfferType" ADD VALUE 'LA_RUCHE_VIVANTE';
ALTER TYPE "OfferType" ADD VALUE 'LA_CHAMBRE_DE_LA_REINE';
ALTER TYPE "OfferType" ADD VALUE 'SOS_URGENCE_VIP';
ALTER TYPE "OfferType" ADD VALUE 'LE_FIL_DE_LA_RUCHE';
