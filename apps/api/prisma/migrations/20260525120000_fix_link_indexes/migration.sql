-- Drop the index that duplicated the @unique-backed "Link_slug_key".
DROP INDEX "Link_slug_idx";

-- Index the foreign key that every dashboard list query filters on
-- (LinkRepository.findByWorkspace -> WHERE "workspaceId" = ...).
CREATE INDEX "Link_workspaceId_idx" ON "Link"("workspaceId");
