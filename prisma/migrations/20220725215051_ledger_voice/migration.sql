-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('TEXT', 'VOICE');

-- AlterTable
ALTER TABLE "LedgerChannel" ADD COLUMN     "type" "ChannelType";

-- CreateTable
CREATE TABLE "LedgerVoiceSnippet" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "snippetFileName" TEXT NOT NULL,
    "transcriptionStartedAt" TIMESTAMP(3),
    "transcription" TEXT,
    "ledgerChannelId" INTEGER NOT NULL,
    "ledgerUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerVoiceSnippet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LedgerVoiceSnippet" ADD CONSTRAINT "LedgerVoiceSnippet_ledgerUserId_fkey" FOREIGN KEY ("ledgerUserId") REFERENCES "LedgerUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerVoiceSnippet" ADD CONSTRAINT "LedgerVoiceSnippet_ledgerChannelId_fkey" FOREIGN KEY ("ledgerChannelId") REFERENCES "LedgerChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
