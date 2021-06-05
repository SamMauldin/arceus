-- DropIndex
DROP INDEX "LedgerMessage.ledgerChannelId_index";

-- AlterTable
ALTER TABLE "LedgerMessage" ADD COLUMN     "embed" JSONB;
