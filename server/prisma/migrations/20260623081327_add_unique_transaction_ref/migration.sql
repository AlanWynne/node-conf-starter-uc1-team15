/*
  Warnings:

  - A unique constraint covering the columns `[transactionRef]` on the table `Dispute` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Dispute_transactionRef_key" ON "Dispute"("transactionRef");
