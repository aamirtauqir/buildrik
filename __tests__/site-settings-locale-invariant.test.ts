import { describe, it, expect } from "vitest";

/**
 * Codex pass-1 P2-L2 — locale invariant must be enforced atomically.
 *
 * The previous implementation read site.defaultLocale + enabledLocales,
 * validated, and then issued prisma.site.update separately. Concurrent
 * updates could both read, both validate against their own snapshot, and
 * commit back-to-back — leaving defaultLocale ∉ enabledLocales.
 *
 * The fix wraps the read-validate-write in an interactive transaction
 * with a `SELECT … FOR UPDATE` pessimistic row lock so concurrent
 * locale updates serialize on the site row.
 *
 * Pin the contract via source inspection: a runtime test would need a
 * real Postgres instance + concurrency harness, which isn't available
 * in this suite. The grep approach matches the same pattern used for
 * the api-tokens ACTIVE filter and bearer fail-closed pins.
 */
describe("updateSiteSettings: locale invariant atomicity", () => {
  it("uses prisma.$transaction with FOR UPDATE row lock when locale fields change", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const root = path.resolve(import.meta.dirname, "..");
    const src = await fs.readFile(
      path.join(root, "server/services/site-settings.service.ts"),
      "utf-8",
    );

    // Pin: the locale-guarded branch wraps the validate+update in $transaction.
    expect(src).toMatch(/needsLocaleGuard\b[\s\S]*?prisma\.\$transaction/);

    // Pin: a SELECT … FOR UPDATE statement targets the Site row inside the tx.
    expect(src).toMatch(/SELECT id FROM "Site" WHERE id = \$\{siteId\} FOR UPDATE/);

    // Pin: the validation throw still fires inside the transaction (NOT outside).
    expect(src).toMatch(
      /\$transaction\([\s\S]*?throw new Error\("DEFAULT_LOCALE_NOT_ENABLED"\)[\s\S]*?\}\s*\)/,
    );
  });

  it("non-locale settings updates skip the transaction (perf path preserved)", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const root = path.resolve(import.meta.dirname, "..");
    const src = await fs.readFile(
      path.join(root, "server/services/site-settings.service.ts"),
      "utf-8",
    );
    // Pin: the non-guarded path uses a plain prisma.site.update at the end.
    // Match the trailing branch — comes after the if (needsLocaleGuard) block.
    expect(src).toMatch(/\}\s*\n\s*\n\s*return prisma\.site\.update\(\{\s*\n\s*where: \{ id: siteId \}/);
  });
});
