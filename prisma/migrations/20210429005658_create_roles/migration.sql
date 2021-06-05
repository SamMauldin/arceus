-- CreateTable
CREATE TABLE "DiscordUser" (
    "id" SERIAL NOT NULL,
    "discordUserId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grant" (
    "id" SERIAL NOT NULL,
    "node" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DiscordUserToRole" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordUser.discordUserId_unique" ON "DiscordUser"("discordUserId");

-- CreateIndex
CREATE UNIQUE INDEX "_DiscordUserToRole_AB_unique" ON "_DiscordUserToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_DiscordUserToRole_B_index" ON "_DiscordUserToRole"("B");

-- AddForeignKey
ALTER TABLE "Grant" ADD FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscordUserToRole" ADD FOREIGN KEY ("A") REFERENCES "DiscordUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscordUserToRole" ADD FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
