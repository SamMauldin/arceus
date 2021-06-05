/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `ConfigItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ConfigItem.key_unique" ON "ConfigItem"("key");
