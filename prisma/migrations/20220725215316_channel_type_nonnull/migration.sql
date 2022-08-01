/*
  Warnings:

  - Made the column `type` on table `LedgerChannel` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "LedgerChannel" ALTER COLUMN "type" SET NOT NULL;
