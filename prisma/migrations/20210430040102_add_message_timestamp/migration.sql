/*
  Warnings:

  - Added the required column `timestamp` to the `LedgerMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LedgerMessage" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "LedgerMessage.ledgerChannelId_timestamp_index" ON "LedgerMessage"("ledgerChannelId", "timestamp");
