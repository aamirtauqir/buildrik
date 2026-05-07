-- Phase 0.5: server-backed media library + per-asset versions + template versions.
-- Unblocks Phase A (folders backend), Phase B (asset + template versions),
-- Phase C (storage quota tied to MediaAsset.bytes).
-- All four tables are NEW; no data migration needed.

-- CreateTable: MediaFolder (Phase A)
CREATE TABLE "media_folders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MediaAsset (Phase 0.5)
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT,
    "folderId" TEXT,
    "url" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "altText" TEXT,
    "generatedMetadata" JSONB,
    "userMetadata" JSONB,
    "lastJobKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MediaAssetVersion (Phase B)
CREATE TABLE "media_asset_versions" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL DEFAULT 0,
    "edits" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_asset_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TemplateVersion (Phase B)
CREATE TABLE "template_versions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "semver" TEXT NOT NULL,
    "pages" JSONB NOT NULL,
    "changelogMd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: MediaFolder
CREATE INDEX "media_folders_userId_parentId_idx" ON "media_folders"("userId", "parentId");
CREATE INDEX "media_folders_siteId_idx" ON "media_folders"("siteId");

-- CreateIndex: MediaAsset
CREATE INDEX "media_assets_userId_type_createdAt_idx" ON "media_assets"("userId", "type", "createdAt");
CREATE INDEX "media_assets_folderId_idx" ON "media_assets"("folderId");
CREATE INDEX "media_assets_siteId_idx" ON "media_assets"("siteId");

-- CreateIndex: MediaAssetVersion
CREATE INDEX "media_asset_versions_assetId_createdAt_idx" ON "media_asset_versions"("assetId", "createdAt");

-- CreateIndex: TemplateVersion
CREATE UNIQUE INDEX "template_versions_templateId_semver_key" ON "template_versions"("templateId", "semver");
CREATE INDEX "template_versions_templateId_createdAt_idx" ON "template_versions"("templateId", "createdAt");

-- AddForeignKey: MediaFolder.parentId → MediaFolder.id (self-reference, tree)
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: MediaAsset.folderId → MediaFolder.id
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: MediaAssetVersion.assetId → MediaAsset.id (cascade delete)
ALTER TABLE "media_asset_versions" ADD CONSTRAINT "media_asset_versions_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: TemplateVersion.templateId → templates.id (cascade delete)
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
