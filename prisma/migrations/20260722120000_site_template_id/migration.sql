-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "templateId" TEXT;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
