/**
 * Contract tests for the typed MediaError hierarchy.
 *
 * These don't need a Composer — they verify the type surface the UI
 * dispatches on (name + rescueAction). Locks in the contract so UI
 * toast routing in useMediaState and ReplaceAcrossDialog can't silently
 * drift from the engine.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import {
  MediaError,
  MediaQuotaError,
  MediaValidationError,
  MediaNoActivePageError,
  MediaReplacePartialError,
} from "../MediaStorageTypes";
import { MEDIA_EVENTS } from "../../../shared/constants/media";

describe("MediaError hierarchy", () => {
  it("MediaError subclasses are instanceof Error and MediaError", () => {
    const quota = new MediaQuotaError(600, 500, 50);
    const validation = new MediaValidationError("bad", "mime");
    const noPage = new MediaNoActivePageError();
    const partial = new MediaReplacePartialError(
      [{ elementId: "el-1", error: "nope" }],
      3,
    );

    for (const err of [quota, validation, noPage, partial]) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(MediaError);
    }
  });

  it("each error carries its distinct name for UI dispatch", () => {
    expect(new MediaQuotaError(1, 1, 1).name).toBe("MediaQuotaError");
    expect(new MediaValidationError("", "size").name).toBe("MediaValidationError");
    expect(new MediaNoActivePageError().name).toBe("MediaNoActivePageError");
    expect(new MediaReplacePartialError([], 0).name).toBe("MediaReplacePartialError");
  });

  it("rescueAction is set per subclass — UI routing contract", () => {
    expect(new MediaQuotaError(1, 1, 1).rescueAction).toBe("show-quota-banner");
    expect(new MediaValidationError("", "mime").rescueAction).toBe("show-validation-toast");
    expect(new MediaNoActivePageError().rescueAction).toBe("prompt-select-page");
    expect(new MediaReplacePartialError([], 0).rescueAction).toBe(
      "show-partial-failure-dialog",
    );
  });

  it("MediaQuotaError carries the numbers the banner needs", () => {
    const err = new MediaQuotaError(600 * 1024 * 1024, 500 * 1024 * 1024, 10 * 1024 * 1024);
    expect(err.usedBytes).toBe(600 * 1024 * 1024);
    expect(err.quotaBytes).toBe(500 * 1024 * 1024);
    expect(err.attemptedBytes).toBe(10 * 1024 * 1024);
    expect(err.message).toMatch(/600MB used of 500MB/);
  });

  it("MediaReplacePartialError carries the failed[] array for the dialog", () => {
    const failed = [
      { elementId: "el-A", error: "locked" },
      { elementId: "el-B", error: "stale" },
    ];
    const err = new MediaReplacePartialError(failed, 3);
    expect(err.failed).toEqual(failed);
    expect(err.succeeded).toBe(3);
    expect(err.message).toBe("Replaced 3 elements, 2 failed");
  });

  it("singular succeeded count produces singular message", () => {
    const err = new MediaReplacePartialError([{ elementId: "x", error: "y" }], 1);
    expect(err.message).toBe("Replaced 1 element, 1 failed");
  });
});

describe("MEDIA_EVENTS — contract with UI subscribers", () => {
  it("exposes the insert/replace/quota/library lifecycle events Lane B relies on", () => {
    // These are the string constants the UI passes to composer.media.on(...).
    // If any name drifts, every subscriber silently stops firing.
    expect(MEDIA_EVENTS.INSERT_SUCCEEDED).toBe("media:insert:succeeded");
    expect(MEDIA_EVENTS.INSERT_FAILED).toBe("media:insert:failed");
    expect(MEDIA_EVENTS.REPLACE_OPENED).toBe("media:replace:opened");
    expect(MEDIA_EVENTS.REPLACE_COMMITTED).toBe("media:replace:committed");
    expect(MEDIA_EVENTS.REPLACE_PARTIAL).toBe("media:replace:partial");
    expect(MEDIA_EVENTS.REPLACE_ROLLED_BACK).toBe("media:replace:rolled_back");
    expect(MEDIA_EVENTS.QUOTA_EXCEEDED).toBe("media:quota:exceeded");
    expect(MEDIA_EVENTS.LIBRARY_OPENED).toBe("media:library:opened");
  });

  it("preserves the pre-existing upload/media/folder events (no regressions)", () => {
    expect(MEDIA_EVENTS.UPLOAD_START).toBe("media:upload:start");
    expect(MEDIA_EVENTS.UPLOAD_PROGRESS).toBe("media:upload:progress");
    expect(MEDIA_EVENTS.UPLOAD_COMPLETE).toBe("media:upload:complete");
    expect(MEDIA_EVENTS.UPLOAD_ERROR).toBe("media:upload:error");
    expect(MEDIA_EVENTS.MEDIA_ADDED).toBe("media:added");
    expect(MEDIA_EVENTS.MEDIA_DELETED).toBe("media:deleted");
  });
});
