/*
  Warnings:

  - A unique constraint covering the columns `[roleId,node]` on the table `Grant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Grant.roleId_node_unique" ON "Grant"("roleId", "node");
