-- Add disputeRef column with a temporary default so existing rows get a value,
-- then remove the default (SQLite doesn't support ALTER COLUMN, so we rely on
-- application-level generation for new rows going forward).

ALTER TABLE "Dispute" ADD COLUMN "disputeRef" TEXT NOT NULL DEFAULT '';

-- Create the unique index
CREATE UNIQUE INDEX "Dispute_disputeRef_key" ON "Dispute"("disputeRef");
