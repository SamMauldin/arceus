/*
  Warnings:

  - You are about to drop the `LedgerVoiceMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LedgerVoiceMessage" DROP CONSTRAINT "LedgerVoiceMessage_ledgerChannelId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerVoiceMessage" DROP CONSTRAINT "LedgerVoiceMessage_ledgerUserId_fkey";

-- DropTable
DROP TABLE "LedgerVoiceMessage";
