/*
  Warnings:

  - You are about to drop the column `token` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `discordToken` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Session` table. All the data in the column will be lost.
  - The required column `sessionToken` was added to the `Session` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `loginToken` was added to the `Session` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "token",
DROP COLUMN "discordToken",
DROP COLUMN "userId",
ADD COLUMN     "sessionToken" TEXT NOT NULL,
ADD COLUMN     "loginToken" TEXT NOT NULL,
ADD COLUMN     "discordUserId" TEXT;
