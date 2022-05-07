/*
  Warnings:

  - You are about to alter the column `balance` on the `DiscordUser` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "DiscordUser" ALTER COLUMN "balance" SET DEFAULT 1000,
ALTER COLUMN "balance" SET DATA TYPE INTEGER;
