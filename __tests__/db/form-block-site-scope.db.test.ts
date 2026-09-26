/**
 * Ldata bug A — a FormBlock belongs to ONE site.
 *
 * A form's identity is the element id (or HTML id) it carries into the
 * published page — `/api/public/forms/<siteId>/<blockId>`. Two sites made from
 * the same template share page-1 element ids, and AI-drafted forms share HTML
 * ids like "contact-form". While that id was the GLOBAL primary key, publishing
 * site B updated SITE A's row (settings overwritten across tenants) and site B
 * never got a row of its own, so its visitors' submissions hit FORM_NOT_FOUND.
 * Real Postgres, real services.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getFormBlockSettings,
  getPublishedFormSettings,
  recordPublishedForms,
  submitForm,
  updateFormBlock,
} from "@/server/services/form-submission.service";
import type { DiscoveredForm } from "@/lib/publish-forms";
import { createTestUser, createTestWorkspace, createTestSite, truncateTables } from "./helpers";

const SHARED_ID = "contact-form";

const form = (blockId: string, fieldName = "email"): DiscoveredForm => ({
  blockId,
  path: "/",
  name: "Contact",
  fields: [{ name: fieldName, type: "email" }],
});

beforeEach(async () => {
  await truncateTables("site", "workspace", "user");
});

async function twoSites() {
  const user = await createTestUser();
  const wsA = await createTestWorkspace({ ownerId: user.id });
  const wsB = await createTestWorkspace({ ownerId: user.id });
  const siteA = await createTestSite({ workspaceId: wsA.id, createdBy: user.id });
  const siteB = await createTestSite({ workspaceId: wsB.id, createdBy: user.id });
  return { siteA, siteB };
}

describe("FormBlock identity is (siteId, blockId)", () => {
  it("two sites publishing the same form id get two rows, each on its own site", async () => {
    const { siteA, siteB } = await twoSites();

    await recordPublishedForms(siteA.id, [form(SHARED_ID, "a_field")], true);
    await recordPublishedForms(siteB.id, [form(SHARED_ID, "b_field")], true);

    const rows = await prisma.formBlock.findMany({ where: { blockId: SHARED_ID }, orderBy: { siteId: "asc" } });
    expect(rows).toHaveLength(2);
    const bySite = Object.fromEntries(rows.map((r) => [r.siteId, r]));
    expect(bySite[siteA.id].fields).toEqual([{ name: "a_field", type: "email" }]);
    expect(bySite[siteB.id].fields).toEqual([{ name: "b_field", type: "email" }]);
    expect(bySite[siteA.id].isActive).toBe(true);
    expect(bySite[siteB.id].isActive).toBe(true);
  });

  it("each site's inspector settings stay its own", async () => {
    const { siteA, siteB } = await twoSites();
    await recordPublishedForms(siteA.id, [form(SHARED_ID)], true);

    await updateFormBlock({ siteId: siteA.id, blockId: SHARED_ID, successMessage: "Thanks from A", spamProtection: false });
    // Site B's owner edits a form with the same element id — before and after B publishes.
    await updateFormBlock({ siteId: siteB.id, blockId: SHARED_ID, successMessage: "Thanks from B" });
    await recordPublishedForms(siteB.id, [form(SHARED_ID)], true);

    expect(await getFormBlockSettings(siteA.id, SHARED_ID)).toMatchObject({
      successMessage: "Thanks from A",
      spamProtection: false,
    });
    expect(await getFormBlockSettings(siteB.id, SHARED_ID)).toMatchObject({
      successMessage: "Thanks from B",
      spamProtection: true,
    });
    expect(await getPublishedFormSettings(siteA.id)).toEqual({
      [SHARED_ID]: { spamProtection: false, successMessage: "Thanks from A" },
    });
    expect(await getPublishedFormSettings(siteB.id)).toEqual({
      [SHARED_ID]: { spamProtection: true, successMessage: "Thanks from B" },
    });
  });

  it("each site's public submission lands on its own row", async () => {
    const { siteA, siteB } = await twoSites();
    await recordPublishedForms(siteA.id, [form(SHARED_ID)], true);
    await recordPublishedForms(siteB.id, [form(SHARED_ID)], true);

    const a = await submitForm(siteA.id, SHARED_ID, { data: { email: "a@x.test" } }, "1.1.1.1");
    const b = await submitForm(siteB.id, SHARED_ID, { data: { email: "b@x.test" } }, "1.1.1.1");

    const rowA = await prisma.formBlock.findFirstOrThrow({ where: { siteId: siteA.id, blockId: SHARED_ID } });
    const rowB = await prisma.formBlock.findFirstOrThrow({ where: { siteId: siteB.id, blockId: SHARED_ID } });
    const subA = await prisma.formSubmission.findUniqueOrThrow({ where: { id: a.id } });
    const subB = await prisma.formSubmission.findUniqueOrThrow({ where: { id: b.id } });
    expect(subA).toMatchObject({ siteId: siteA.id, formBlockId: rowA.id });
    expect(subB).toMatchObject({ siteId: siteB.id, formBlockId: rowB.id });
  });

  it("one site's deactivation sweep never touches the other site's row", async () => {
    const { siteA, siteB } = await twoSites();
    await recordPublishedForms(siteA.id, [form(SHARED_ID)], true);
    await recordPublishedForms(siteB.id, [form(SHARED_ID)], true);

    // Site B republishes without the form.
    await recordPublishedForms(siteB.id, [], true);

    const rowA = await prisma.formBlock.findFirstOrThrow({ where: { siteId: siteA.id, blockId: SHARED_ID } });
    const rowB = await prisma.formBlock.findFirstOrThrow({ where: { siteId: siteB.id, blockId: SHARED_ID } });
    expect(rowA.isActive).toBe(true);
    expect(rowB.isActive).toBe(false);
  });

  it("a site's second row under the same element id is impossible", async () => {
    const { siteA } = await twoSites();
    await recordPublishedForms(siteA.id, [form(SHARED_ID)], true);
    await expect(
      prisma.formBlock.create({
        data: { siteId: siteA.id, blockId: SHARED_ID, name: "dup", fields: [] },
      }),
    ).rejects.toThrow();
  });

  it("publish finds a row carried over under a surrogate id (site duplication) instead of making a second", async () => {
    const { siteB } = await twoSites();
    const copied = await prisma.formBlock.create({
      data: { siteId: siteB.id, blockId: SHARED_ID, name: "Copied", fields: [], successMessage: "kept" },
    });

    await recordPublishedForms(siteB.id, [form(SHARED_ID)], true);

    const rows = await prisma.formBlock.findMany({ where: { siteId: siteB.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: copied.id, isActive: true, successMessage: "kept" });
  });
});
