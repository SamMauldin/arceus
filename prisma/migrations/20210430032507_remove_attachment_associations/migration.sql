/*
  Warnings:

  - You are about to drop the column `ledgerChannelId` on the `LedgerAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `ledgerUserId` on the `LedgerAttachment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "LedgerAttachment" DROP CONSTRAINT "LedgerAttachment_ledgerChannelId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerAttachment" DROP CONSTRAINT "LedgerAttachment_ledgerUserId_fkey";

-- AlterTable
ALTER TABLE "LedgerAttachment" DROP COLUMN "ledgerChannelId",
DROP COLUMN "ledgerUserId";
