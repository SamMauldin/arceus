-- CreateTable
CREATE TABLE "CasinoRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "wager" INTEGER NOT NULL,
    "winnings" INTEGER NOT NULL,

    CONSTRAINT "CasinoRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CasinoRecord" ADD CONSTRAINT "CasinoRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "DiscordUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
