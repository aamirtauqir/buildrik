-- AlterTable: per-app configuration for installed marketplace apps (Live Chat, …).
-- Additive + nullable — existing rows keep NULL (app installed but not yet configured).
ALTER TABLE "workspace_apps" ADD COLUMN     "config" JSONB;
