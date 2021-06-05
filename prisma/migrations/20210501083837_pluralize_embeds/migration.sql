/*
  Warnings:

  - You are about to drop the column `embed` on the `LedgerMessage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LedgerMessage" DROP COLUMN "embed",
ADD COLUMN     "embeds" JSONB;
