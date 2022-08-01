/*
  Warnings:

  - You are about to drop the column `snippetFileName` on the `LedgerVoiceSnippet` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[snippetId]` on the table `LedgerVoiceSnippet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `snippetId` to the `LedgerVoiceSnippet` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "LedgerVoiceSnippet_snippetFileName_key";

-- AlterTable
ALTER TABLE "LedgerVoiceSnippet" DROP COLUMN "snippetFileName",
ADD COLUMN     "snippetId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LedgerVoiceSnippet_snippetId_key" ON "LedgerVoiceSnippet"("snippetId");
