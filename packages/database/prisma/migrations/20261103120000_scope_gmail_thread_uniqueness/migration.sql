-- Gmail thread IDs identify a mailbox thread, so uniqueness must be scoped to its owner.
-- This changes only indexes; it does not update or remove application records.
DROP INDEX "Application_gmailThreadId_key";

CREATE UNIQUE INDEX "Application_userId_gmailThreadId_key"
ON "Application"("userId", "gmailThreadId");
