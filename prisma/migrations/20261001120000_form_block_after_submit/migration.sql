-- Form Settings inspector (AFTER SUBMIT + PROTECTION): the FormBlock row
-- already carried successMessage/notifyEmail, but had no write path and no
-- way to choose a redirect or turn spam protection off. Defaults keep every
-- existing row's observable behaviour unchanged (message shown, honeypot on).
ALTER TABLE "form_blocks" ADD COLUMN "successAction" TEXT NOT NULL DEFAULT 'MESSAGE';
ALTER TABLE "form_blocks" ADD COLUMN "redirectUrl" TEXT;
ALTER TABLE "form_blocks" ADD COLUMN "spamProtection" BOOLEAN NOT NULL DEFAULT true;
