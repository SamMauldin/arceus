/*
  Warnings:

  - A unique constraint covering the columns `[snippetFileName]` on the table `LedgerVoiceSnippet` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LedgerVoiceSnippet_snippetFileName_key" ON "LedgerVoiceSnippet"("snippetFileName");
