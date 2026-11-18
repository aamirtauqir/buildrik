-- Page trash restore race (design-2l9 A-21 follow-up). Additive only.
-- A restore stamps `restoredAt`; an editor save whose base (expectedLastEditedAt)
-- is older than that stamp was built before the restore and must not move the
-- restored page back to the trash.
ALTER TABLE "pages" ADD COLUMN "restoredAt" TIMESTAMP(3);
