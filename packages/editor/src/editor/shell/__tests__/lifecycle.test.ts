/**
 * The next-move table. Written as a table on purpose: the bug this replaces was
 * one control meaning six different things, and a table is the only shape where
 * "these two rows render the same button" is visible.
 */
import { describe, it, expect } from "vitest";
import { deriveLifecycleState, type LifecycleInput } from "../lifecycle";

/** A workspace that requires client approval, actor is an editor, online,
 *  nothing wrong with the site, never published. */
const base: LifecycleInput = {
  reviewState: "none",
  reviewsEnabled: true,
  editsRequireApproval: true,
  isPublished: false,
  hasUnpublishedChanges: null,
  isViewer: false,
  publishEnabled: true,
  offline: false,
  errorCount: 0,
};
const at = (over: Partial<LifecycleInput>): LifecycleInput => ({ ...base, ...over });

describe("deriveLifecycleState — the approval path", () => {
  const rows: Array<[LifecycleInput["reviewState"], string, string | null]> = [
    ["none", "Send for review", null],
    ["pending", "Publish", "Waiting on your client's approval"],
    ["opened-not-acted", "Publish", "Waiting on your client's approval"],
    ["changes-requested", "Open feedback", null],
    ["approved", "Publish", null],
    ["approved-edited-since", "Publish", null],
  ];

  it.each(rows)("%s → %s", (reviewState, label, blockedReason) => {
    const move = deriveLifecycleState(at({ reviewState }));
    expect(move?.label).toBe(label);
    expect(move?.blockedReason).toBe(blockedReason);
  });

  it("every row names its position in one sentence, and never with a count", () => {
    for (const [reviewState] of rows) {
      const hint = deriveLifecycleState(at({ reviewState }))?.hint ?? "";
      expect(hint.length).toBeGreaterThan(0);
      expect(hint.split(". ").filter(Boolean)).toHaveLength(1);
      expect(hint).not.toMatch(/\d/);
    }
  });

  it("changes-requested opens the feedback, it does not disable publish", () => {
    // The one deviation from wireframes §2, and the reason for it: there IS a
    // next act here, and a greyed-out Publish names only what you cannot do.
    expect(deriveLifecycleState(at({ reviewState: "changes-requested" }))?.kind).toBe(
      "open-feedback",
    );
  });

  it("an approval that no longer covers the site is stated, not blocked", () => {
    // The server's gate (publish-approval.ts) owns whether this needs an
    // explicit acknowledgement. The shell's job is to say so, not to refuse.
    const move = deriveLifecycleState(at({ reviewState: "approved-edited-since" }));
    expect(move?.blockedReason).toBeNull();
    expect(move?.hint).toMatch(/hasn't seen/);
  });
});

describe("deriveLifecycleState — no review in the path", () => {
  const noReview = { reviewsEnabled: false, editsRequireApproval: false } as const;

  it("never published → Publish", () => {
    const move = deriveLifecycleState(at({ ...noReview }));
    expect(move?.kind).toBe("publish");
    expect(move?.label).toBe("Publish");
    expect(move?.hint).toBe("Not live yet.");
  });

  it("live with changes → Publish changes", () => {
    const move = deriveLifecycleState(
      at({ ...noReview, isPublished: true, hasUnpublishedChanges: true }),
    );
    expect(move?.label).toBe("Publish changes");
  });

  /* The load-bearing null. A live site with nothing waiting has no next act,
     and a button that means "press me to do nothing" is how a control stops
     meaning anything. */
  it("live with nothing waiting → NO move at all", () => {
    expect(
      deriveLifecycleState(at({ ...noReview, isPublished: true, hasUnpublishedChanges: false })),
    ).toBeNull();
  });

  it("live, and we do not know whether anything changed → still offer Publish", () => {
    // Unknown is not "nothing to do". Withholding the control here would leave
    // a site with real unpublished edits looking finished.
    expect(
      deriveLifecycleState(at({ ...noReview, isPublished: true, hasUnpublishedChanges: null }))
        ?.label,
    ).toBe("Publish");
  });

  it("reviews on but approval optional → the verb is still publish", () => {
    const move = deriveLifecycleState(
      at({ reviewsEnabled: true, editsRequireApproval: false, reviewState: "none" }),
    );
    expect(move?.kind).toBe("publish");
  });
});

describe("deriveLifecycleState — off the happy path", () => {
  it("flags not answered yet → an in-flight control, not an empty slot", () => {
    // Withholding the CTA on first paint empties the topbar and then pops a
    // button in; offering an enabled Publish on an approval workspace is a door
    // into a refusal. Disabled, with a reason, is neither.
    for (const over of [{ reviewsEnabled: null }, { editsRequireApproval: null }] as const) {
      const move = deriveLifecycleState(at(over));
      expect(move?.kind).toBe("publish");
      expect(move?.blockedReason).toBe("Checking this site's review settings…");
    }
  });

  it("a server too old to send the flags does not block publishing forever", () => {
    // `undefined` is a standing condition (deploy skew), not a beat. Holding the
    // in-flight control through it makes publishing impossible for as long as
    // the skew lasts; the server's own approval gate is the real authority.
    const move = deriveLifecycleState({
      ...base,
      reviewsEnabled: undefined as unknown as null,
      editsRequireApproval: undefined as unknown as null,
    });
    expect(move?.kind).toBe("publish");
    expect(move?.blockedReason).toBeNull();
  });

  it("a MIXED pair resolves on the weaker flag, not the stronger", () => {
    /* Review caught this: testing each flag independently with `=== null` let
       `reviewsEnabled: true` + `editsRequireApproval: undefined` skip the
       unknown branch and fail the `&&`, so a workspace whose approval policy
       was merely missing got an unguarded Publish. */
    const half = deriveLifecycleState(
      at({ reviewsEnabled: true, editsRequireApproval: undefined as unknown as null }),
    );
    expect(half?.kind).toBe("publish");
    expect(half?.blockedReason).toBeNull();

    // And the reverse: one flag still being ASKED holds the in-flight control
    // even when its partner has answered.
    const pending = deriveLifecycleState(at({ reviewsEnabled: true, editsRequireApproval: null }));
    expect(pending?.blockedReason).toBe("Checking this site's review settings…");
  });

  it("a blocker we already know outranks the in-flight one", () => {
    // Viewer/offline/flag-off do not depend on the review flags — those answers
    // are final at first paint and must not be replaced by "checking…".
    expect(deriveLifecycleState(at({ reviewsEnabled: null, offline: true }))?.blockedReason).toBe(
      "Can't publish while offline",
    );
  });

  it("a blocked publish is shown with its reason, never withheld", () => {
    const cases: Array<[Partial<LifecycleInput>, string]> = [
      [{ publishEnabled: false }, "Publishing isn't switched on for this workspace yet"],
      [{ isViewer: true }, "Viewers can't publish — ask an editor"],
      [{ offline: true }, "Can't publish while offline"],
    ];
    for (const [over, reason] of cases) {
      const move = deriveLifecycleState(at({ reviewState: "approved", ...over }));
      expect(move).not.toBeNull();
      expect(move?.blockedReason).toBe(reason);
    }
  });

  it("a workspace with publishing off can still send for review", () => {
    // publishEnabled gates publish. It has never gated a review round, and
    // blocking the send here would strand the site with no move at all.
    const move = deriveLifecycleState(at({ publishEnabled: false, reviewState: "none" }));
    expect(move?.kind).toBe("send-for-review");
    expect(move?.blockedReason).toBeNull();
  });

  it("a viewer may read feedback but may not send", () => {
    expect(
      deriveLifecycleState(at({ isViewer: true, reviewState: "changes-requested" }))?.blockedReason,
    ).toBeNull();
    expect(deriveLifecycleState(at({ isViewer: true, reviewState: "none" }))?.blockedReason).toBe(
      "Viewers can't send for review — ask an editor",
    );
  });

  it("site errors re-label publish, they do not block it", () => {
    const move = deriveLifecycleState(at({ reviewState: "approved", errorCount: 2 }));
    expect(move?.label).toBe("Publish anyway");
    expect(move?.blockedReason).toBeNull();
  });

  it("a real block outranks the error re-label — one refusal, not two", () => {
    const move = deriveLifecycleState(at({ reviewState: "approved", errorCount: 2, offline: true }));
    expect(move?.label).toBe("Publish");
    expect(move?.blockedReason).toBe("Can't publish while offline");
  });

  it("a blocked publish still says what is waiting to ship", () => {
    const move = deriveLifecycleState(
      at({ reviewState: "pending", isPublished: true, hasUnpublishedChanges: true }),
    );
    expect(move?.label).toBe("Publish changes");
    expect(move?.blockedReason).toBe("Waiting on your client's approval");
  });
});

/* Boards 307:2193 and 307:2203 write every sentence about the round with the
   reviewer's name in it. The shell already had the name — the approved pill and
   the resend toast both print it — while these lines said "your client". */
describe("deriveLifecycleState — the reviewer has a name", () => {
  const named = (over: Partial<LifecycleInput>) =>
    deriveLifecycleState(at({ reviewerName: "Sara", ...over }));

  it("names the reviewer in the hint and in the refusal", () => {
    expect(named({ reviewState: "pending" })?.hint).toBe("Sent to Sara — waiting on approval.");
    expect(named({ reviewState: "pending" })?.blockedReason).toBe("Waiting on Sara's approval");
    expect(named({ reviewState: "opened-not-acted" })?.hint).toBe("Sara has opened the review.");
    expect(named({ reviewState: "changes-requested" })?.hint).toBe("Sara asked for changes.");
  });

  /* `null` is the server saying it has no name, and a sentence with a hole in
     it ("Sent to  — waiting") is worse than the generic one. Whitespace counts
     as no name for the same reason. */
  it.each([[null], [undefined], ["   "]])("falls back to the generic line for %p", (reviewerName) => {
    const move = deriveLifecycleState(at({ reviewState: "pending", reviewerName }));
    expect(move?.hint).toBe("Sent to your client — waiting on approval.");
    expect(move?.blockedReason).toBe("Waiting on your client's approval");
  });

  it("capitalises the subject when it stands first, and does not when it does not", () => {
    expect(deriveLifecycleState(at({ reviewState: "changes-requested" }))?.hint).toBe(
      "Your client asked for changes.",
    );
    expect(deriveLifecycleState(at({ reviewState: "pending" }))?.hint).toMatch(/to your client/);
  });
});
