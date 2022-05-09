/*
  Warnings:

  - Added the required column `game` to the `CasinoRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CasinoRecord" ADD COLUMN     "game" TEXT NOT NULL;
