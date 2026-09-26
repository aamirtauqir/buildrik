-- Ldata bug B: CMS bindings (which canvas element shows which collection
-- field, which element repeats per record) had no column. The editor's save
-- carried them, the save schema stripped them, and every reload from the
-- server unbound every element — the next publish shipped placeholder copy.
-- Additive, nullable, no backfill: bindings made before this deploy were never
-- stored anywhere, so there is nothing to recover.
ALTER TABLE "sites" ADD COLUMN "projectCmsBindings" JSONB;
