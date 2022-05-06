-- DropForeignKey
ALTER TABLE "Grant" DROP CONSTRAINT "Grant_roleId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerAttachment" DROP CONSTRAINT "LedgerAttachment_ledgerMessageId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerChannel" DROP CONSTRAINT "LedgerChannel_ledgerGuildId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerMessage" DROP CONSTRAINT "LedgerMessage_ledgerChannelId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerMessage" DROP CONSTRAINT "LedgerMessage_ledgerUserId_fkey";

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerChannel" ADD CONSTRAINT "LedgerChannel_ledgerGuildId_fkey" FOREIGN KEY ("ledgerGuildId") REFERENCES "LedgerGuild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerMessage" ADD CONSTRAINT "LedgerMessage_ledgerUserId_fkey" FOREIGN KEY ("ledgerUserId") REFERENCES "LedgerUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerMessage" ADD CONSTRAINT "LedgerMessage_ledgerChannelId_fkey" FOREIGN KEY ("ledgerChannelId") REFERENCES "LedgerChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAttachment" ADD CONSTRAINT "LedgerAttachment_ledgerMessageId_fkey" FOREIGN KEY ("ledgerMessageId") REFERENCES "LedgerMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "ConfigItem.key_unique" RENAME TO "ConfigItem_key_key";

-- RenameIndex
ALTER INDEX "DiscordUser.discordUserId_unique" RENAME TO "DiscordUser_discordUserId_key";

-- RenameIndex
ALTER INDEX "Grant.roleId_node_unique" RENAME TO "Grant_roleId_node_key";

-- RenameIndex
ALTER INDEX "LedgerAttachment.discordId_unique" RENAME TO "LedgerAttachment_discordId_key";

-- RenameIndex
ALTER INDEX "LedgerAttachment.ledgerMessageId_index" RENAME TO "LedgerAttachment_ledgerMessageId_idx";

-- RenameIndex
ALTER INDEX "LedgerChannel.discordId_unique" RENAME TO "LedgerChannel_discordId_key";

-- RenameIndex
ALTER INDEX "LedgerGuild.discordId_unique" RENAME TO "LedgerGuild_discordId_key";

-- RenameIndex
ALTER INDEX "LedgerMessage.discordId_unique" RENAME TO "LedgerMessage_discordId_key";

-- RenameIndex
ALTER INDEX "LedgerMessage.ledgerChannelId_timestamp_index" RENAME TO "LedgerMessage_ledgerChannelId_timestamp_idx";

-- RenameIndex
ALTER INDEX "LedgerUser.discordId_unique" RENAME TO "LedgerUser_discordId_key";

-- RenameIndex
ALTER INDEX "QuarantinedRecord.content_unique" RENAME TO "QuarantinedRecord_content_key";

-- RenameIndex
ALTER INDEX "Role.name_unique" RENAME TO "Role_name_key";

-- RenameIndex
ALTER INDEX "Session.loginToken_unique" RENAME TO "Session_loginToken_key";

-- RenameIndex
ALTER INDEX "Session.sessionToken_unique" RENAME TO "Session_sessionToken_key";
