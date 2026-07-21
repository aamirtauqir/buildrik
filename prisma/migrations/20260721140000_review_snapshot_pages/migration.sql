-- The site's rendered HTML frozen at send (contracts §1.6): [{ path, html }]
-- produced by the editor's ExportEngine at submit time. The client review page
-- renders this snapshot, never the live draft, so the client sees the version
-- they were sent. Null on internal submits with no editor render.
ALTER TABLE "review_requests" ADD COLUMN "snapshotPages" JSONB;
