-- CreateTable
CREATE TABLE "LedgerVoiceMessage" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "transcription" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "ledgerChannelId" INTEGER NOT NULL,
    "ledgerUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerVoiceMessage.ledgerChannelId_timestamp_index" ON "LedgerVoiceMessage"("ledgerChannelId", "timestamp");

-- AddForeignKey
ALTER TABLE "LedgerVoiceMessage" ADD FOREIGN KEY ("ledgerChannelId") REFERENCES "LedgerChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerVoiceMessage" ADD FOREIGN KEY ("ledgerUserId") REFERENCES "LedgerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
