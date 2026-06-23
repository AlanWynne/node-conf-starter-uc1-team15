-- Performance: index on Dispute.createdAt for paginated list queries (ORDER BY createdAt DESC)
-- and index on DisputeStatusHistory.disputeId for FK lookups when including statusHistory.

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dispute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "disputeRef" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "transactionRef" TEXT NOT NULL,
    "paymentType" TEXT NOT NULL,
    "issueCategory" TEXT NOT NULL,
    "transactionStatus" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "transactionDate" DATETIME NOT NULL,
    "description" TEXT,
    "recommendedAction" TEXT NOT NULL,
    "disputeStatus" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Dispute" ("amount", "createdAt", "customerName", "description", "disputeRef", "disputeStatus", "id", "issueCategory", "paymentType", "recommendedAction", "transactionDate", "transactionRef", "transactionStatus", "updatedAt") SELECT "amount", "createdAt", "customerName", "description", "disputeRef", "disputeStatus", "id", "issueCategory", "paymentType", "recommendedAction", "transactionDate", "transactionRef", "transactionStatus", "updatedAt" FROM "Dispute";
DROP TABLE "Dispute";
ALTER TABLE "new_Dispute" RENAME TO "Dispute";
CREATE UNIQUE INDEX "Dispute_disputeRef_key" ON "Dispute"("disputeRef");
CREATE INDEX "Dispute_createdAt_idx" ON "Dispute"("createdAt" DESC);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DisputeStatusHistory_disputeId_idx" ON "DisputeStatusHistory"("disputeId");
