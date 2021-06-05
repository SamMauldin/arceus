-- AlterTable
ALTER TABLE "DiscordUser" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Grant" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "LedgerUser" (
    "id" SERIAL NOT NULL,
    "discordId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerGuild" (
    "id" SERIAL NOT NULL,
    "discordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerChannel" (
    "id" SERIAL NOT NULL,
    "discordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ledgerGuildId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerMessage" (
    "id" SERIAL NOT NULL,
    "discordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ledgerChannelId" INTEGER NOT NULL,
    "ledgerUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerUser.discordId_unique" ON "LedgerUser"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerGuild.discordId_unique" ON "LedgerGuild"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerChannel.discordId_unique" ON "LedgerChannel"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerMessage.discordId_unique" ON "LedgerMessage"("discordId");

-- AddForeignKey
ALTER TABLE "LedgerChannel" ADD FOREIGN KEY ("ledgerGuildId") REFERENCES "LedgerGuild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerMessage" ADD FOREIGN KEY ("ledgerChannelId") REFERENCES "LedgerChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerMessage" ADD FOREIGN KEY ("ledgerUserId") REFERENCES "LedgerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
