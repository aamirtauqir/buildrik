-- Cron + manual "Check DNS" could interleave a delete-all/create-all and double
-- a domain's record rows. Collapse any existing duplicates, then make the write
-- idempotent with a unique index (the service inserts with skipDuplicates).
DELETE FROM "dns_records" a
USING "dns_records" b
WHERE a."domainId" = b."domainId"
  AND a."type" = b."type"
  AND a."host" = b."host"
  AND a."value" = b."value"
  AND (a."verified", a."id") < (b."verified", b."id");

CREATE UNIQUE INDEX "dns_records_domainId_type_host_value_key" ON "dns_records"("domainId", "type", "host", "value");
