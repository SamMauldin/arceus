/*
  Warnings:

  - You are about to drop the column `name` on the `LedgerMessage` table. All the data in the column will be lost.
  - Added the required column `content` to the `LedgerMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LedgerMessage" DROP COLUMN "name",
ADD COLUMN     "content" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "LedgerAttachment" (
    "id" SERIAL NOT NULL,
    "discordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ledgerChannelId" INTEGER NOT NULL,
    "ledgerUserId" INTEGER NOT NULL,
    "ledgerMessageId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAttachment.discordId_unique" ON "LedgerAttachment"("discordId");

-- AddForeignKey
ALTER TABLE "LedgerAttachment" ADD FOREIGN KEY ("ledgerChannelId") REFERENCES "LedgerChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAttachment" ADD FOREIGN KEY ("ledgerUserId") REFERENCES "LedgerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAttachment" ADD FOREIGN KEY ("ledgerMessageId") REFERENCES "LedgerMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
