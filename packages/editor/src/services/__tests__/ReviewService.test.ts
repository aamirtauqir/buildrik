/**
 * ReviewService — editor → dashboard "Send for review". Verifies the submit
 * carries the reviewer note + change-summary (the §16 "no input fields" fix) and
 * that it resolves the current site from the /edit/<id> URL, erroring when absent.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mutate = vi.fn();
vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({ reviews: { submit: { mutate } } }),
}));

import { submitForReview } from "../ReviewService";

beforeEach(() => {
  mutate.mockReset().mockResolvedValue(undefined);
  window.history.pushState({}, "", "/edit/site-123");
});

describe("submitForReview", () => {
  it("sends note + changeSummary for the current site", async () => {
    await submitForReview("please check the hero", "hero copy, 2 images");
    expect(mutate).toHaveBeenCalledWith({
      siteId: "site-123",
      note: "please check the hero",
      changeSummary: "hero copy, 2 images",
    });
  });

  it("omits the optional fields when not provided", async () => {
    await submitForReview();
    expect(mutate).toHaveBeenCalledWith({ siteId: "site-123", note: undefined, changeSummary: undefined });
  });

  it("throws when the URL has no site", async () => {
    window.history.pushState({}, "", "/edit/");
    await expect(submitForReview("x")).rejects.toThrow(/No site/);
    expect(mutate).not.toHaveBeenCalled();
  });
});
