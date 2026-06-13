-- Support tickets had no human-facing number, so the confirmation UI always
-- showed "Ticket #0". A SERIAL gives each ticket a stable sequential id;
-- existing rows are backfilled in insertion order by the sequence.
ALTER TABLE "support_tickets" ADD COLUMN "ticketNumber" SERIAL NOT NULL;
