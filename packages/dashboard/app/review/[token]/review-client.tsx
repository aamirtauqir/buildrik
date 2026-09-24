"use client";

import { useState } from "react";
import { trpc } from "@lib/trpc/client";
import { Button, InputField, Modal } from "@/components/dashboard/primitives";
import { PageCrumb, SnapshotFrame, pageLabel, type SnapshotPage } from "@/components/reviews/signoff-snapshot";

/**
 * Every state of the client review page — Figma family "Client sign-off":
 *   A0 identify (no board — kept, restyled to the family's card)
 *   A  viewing              4418:121903 (+ Menu 173613 / Contact 173649 snapshots)
 *   B  commenting           4418:121999, send failed 4418:122170
 *   C  changes requested    4418:121951
 *   D  approved             4418:121939 (E, edited since approval, shares it)
 *   F  dead link · revoked  4418:121971 (expired / not found / answered share it)
 *
 * Written for a restaurant owner who got a link from their designer. No account,
 * no jargon, and the buttons that matter say what happens when you press them.
 */

const DEAD_LINK_COPY: Record<string, { title: string; body: (agency: string) => string }> = {
  EXPIRED: {
    title: "This link has expired",
    body: () =>
      "Review links work for 90 days. Ask your designer to send a new one — your earlier comments are still saved.",
  },
  REVOKED: {
    title: "This review link was revoked",
    body: (agency) =>
      `This link is no longer active. Ask ${agency} for a new one — your earlier notes are still with your designer.`,
  },
  NOT_FOUND: {
    title: "This link doesn't work",
    body: () =>
      "It may have been copied incompletely. Try clicking the link in your email again rather than pasting it.",
  },
  CONFLICT: {
    title: "You've already answered this",
    body: () => "This round is closed. If you have more to say, your designer can send a new round.",
  },
};

/* Text-only action (boards: "View the design", "Try this link again", "Back to
   design") — the ghost Button with its border and fill taken away. `tw:`-
   prefixed because it overrides flowbite's own (prefixed) theme classes, and
   twMerge only resolves a conflict within one prefix. */
const TEXT_ACTION =
  "tw:border-transparent tw:bg-transparent tw:shadow-none tw:font-normal tw:text-[#111827] tw:hover:bg-[#F3F4F6]";
/* The card and notes-row actions are 28px tall on every board that draws them
   (4418:121951 / 121971 / 121999); the footer's pair is 36. */
const COMPACT = "tw:h-7 tw:text-[13px]";

function Shell({
  agency,
  crumb,
  round,
  children,
  footer,
}: {
  agency: string;
  crumb: React.ReactNode;
  round: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      {/* The agency's name leads, not ours. The client hired them, not us. */}
      <header className="h-14 shrink-0 flex items-center gap-8 px-6 bg-white border-b border-[#E5E7EB]">
        <span className="text-[13px] font-medium text-[#111827]">{agency}</span>
        <span className="flex-1 text-[12px] text-[#4B5563]">{crumb}</span>
        {round ? <span className="pr-6 text-[12px] text-[#111827]">{round}</span> : null}
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
      {/* Sticky, not static. At 1280x720 the two buttons this page exists for
          sat at y=733 — past the fold, on the one screen size we call the
          minimum. A client who cannot see "Approve" does not approve. */}
      {/* And offset by the cookie banner, which is `fixed` at z-[9998] and was
          sitting exactly on top of these two buttons — measured at 1280x720,
          the banner spans y 672-708 and Approve/Request changes sat at y
          668-704, fully covered. The banner publishes its height as
          `--cookie-inset` (components/global/cookie-consent.tsx); 0 when it is
          not there. */}
      {footer ? (
        <footer
          className="sticky z-40 shrink-0 border-t border-[#E5E7EB] bg-white px-6 py-4"
          style={{ bottom: "var(--cookie-inset, 0px)" }}
        >
          {footer}
        </footer>
      ) : null}
    </div>
  );
}

/** The family's message card (C · D · F): 440 wide, 120px under the header. */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex justify-center px-6 pt-[120px]">
      <div className="h-fit w-full max-w-[440px] rounded-lg border border-[#E5E7EB] bg-white p-6">{children}</div>
    </div>
  );
}

function CardText({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h1 className="text-[20px] font-semibold leading-7 text-[#111827]">{title}</h1>
      <p className="mt-1 text-[13px] leading-5 text-[#4B5563]">{body}</p>
    </>
  );
}

const crumbOf = (...parts: React.ReactNode[]) => (
  <>
    {parts.map((p, i) => (
      <span key={i}>
        {i > 0 ? " · " : null}
        {p}
      </span>
    ))}
  </>
);

/** The in-page error UI is the whole handling; see the hooks below. */
const HANDLED_IN_PAGE = (): void => undefined;

export function ReviewClient({ token }: { token: string }) {
  const review = trpc.clientReview.get.useQuery({ token }, { retry: false });
  const identify = trpc.clientReview.identify.useMutation();
  /* Every failure of these two is shown IN the page — the red "not sent" box
     (board 4418:122170) for a change request, `comment.error` under the notes,
     `resolve.error` under the approval. The provider's default mutation
     onError (lib/trpc/client.tsx) also raised a global "Something went wrong"
     toast on top, which the board does not draw. A hook-level onError replaces
     that default for these two mutations only; every other mutation, and any
     error outside them, still gets the global toast. */
  const comment = trpc.clientReview.comment.useMutation({ onError: HANDLED_IN_PAGE });
  const resolve = trpc.clientReview.resolve.useMutation({ onError: HANDLED_IN_PAGE });
  // The client's own notes, so the page isn't write-only — they see what they
  // already said. Only fetched once identified (the router requires it).
  const comments = trpc.clientReview.comments.useQuery(
    { token },
    { enabled: Boolean(review.data?.reviewer), retry: false },
  );
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [draft, setDraft] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  /* Where the client is. "auto" is the state's own screen — the snapshot (A)
     while the round is open, the message card (C/D) once it is closed; the
     other two are where the client chose to go from there. */
  const [view, setView] = useState<"auto" | "snapshot" | "notes">("auto");
  const [confirmApprove, setConfirmApprove] = useState(false);
  /* 4418:122170: the change request did not land. Nothing is lost — the notes
     stay, the draft stays — and the primary becomes "Send again". */
  const [sendFailed, setSendFailed] = useState(false);

  if (review.isLoading) {
    return (
      <Shell agency="Loading" crumb={null} round={null}>
        <Card>
          <p className="text-[13px] text-[#6B7280]">Opening your review…</p>
        </Card>
      </Shell>
    );
  }

  // F · dead link. Four different reasons, four different screens — "expired"
  // and "wrong link" are different problems for the person holding it, and a
  // single "something went wrong" tells them nothing they can act on.
  if (review.error) {
    /* The domain reason first, the transport code second. Keying on the code
       alone made two of these four screens unreachable: the router maps EXPIRED
       and REVOKED to one FORBIDDEN on purpose, so both landed on the malformed
       copy and told a client with a perfectly well-formed link to click it
       again. `cause.reason` is what the router sends alongside it — and, for a
       revoked or expired link, the agency and round it belonged to. */
    const cause = review.error.data?.cause as
      | { reason?: string; agencyName?: string | null; roundNumber?: number }
      | undefined;
    const code = review.error.data?.code ?? "NOT_FOUND";
    const copy = DEAD_LINK_COPY[cause?.reason ?? ""] ?? DEAD_LINK_COPY[code] ?? DEAD_LINK_COPY.NOT_FOUND;
    return (
      <Shell
        agency={cause?.agencyName ?? "Buildrick"}
        crumb="is asking for your feedback"
        round={cause?.roundNumber ? `Round ${cause.roundNumber}` : null}
      >
        <Card>
          <CardText title={copy.title} body={copy.body(cause?.agencyName ?? "your designer")} />
          <div className="mt-4 flex gap-3">
            <Button variant="ghost" size="sm" className={`${TEXT_ACTION} ${COMPACT}`} onClick={() => void review.refetch()}>
              Try this link again
            </Button>
          </div>
        </Card>
      </Shell>
    );
  }

  const data = review.data!;
  // The agency (workspace) name leads the header — the client hired them, not us.
  // Falls back to a neutral label if the workspace has no name.
  const agency = data.agencyName ?? "Your design team";
  const round = data.roundNumber;
  const pages: SnapshotPage[] = data.snapshotPages ?? [];
  const activeIndex = Math.min(pageIndex, Math.max(pages.length - 1, 0));
  const activePage = pages[activeIndex] ?? null;
  const pageCrumb = <PageCrumb pages={pages} active={activeIndex} onPick={setPageIndex} />;

  // A0 · first visit. A signature, not a login — there is no password field
  // here and never will be. The email must match the one invited, so an
  // approval carries a name that means something in a dispute six weeks later.
  if (!data.reviewer) {
    return (
      <Shell agency={agency} crumb="is asking for your feedback" round={`Review round ${round}`}>
        <Card>
          <CardText
            title={`${data.siteName} is ready for you to look at`}
            body="Before you start, tell us who you are. This goes on your comments and your approval so your designer knows who said what — it is not an account, and there is no password."
          />
          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              identify.mutate(
                { token, name, email },
                { onSuccess: () => utils.clientReview.get.invalidate() },
              );
            }}
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-[#4B5563]">Your name</span>
              <InputField value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-[#4B5563]">The email this link was sent to</span>
              <InputField
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={320}
              />
            </label>
            {identify.error ? <p className="text-[12px] text-[#E02424]">{identify.error.message}</p> : null}
            <Button type="submit" disabled={identify.isPending}>
              {identify.isPending ? "One moment…" : `Look at ${data.siteName}`}
            </Button>
          </form>
        </Card>
      </Shell>
    );
  }

  const reviewer = data.reviewer;
  const signedCrumb = crumbOf(data.siteName, pageCrumb, `Signed as ${reviewer.name}`);
  const open = data.status === "PENDING";

  const addNote = () =>
    comment.mutate(
      { token, body: draft },
      {
        onSuccess: () => {
          setDraft("");
          // Show the note we just posted — otherwise the page is write-only and
          // the client can't tell it landed.
          void utils.clientReview.comments.invalidate({ token });
        },
      },
    );

  /* The reason and the verdict were independent controls: typing did nothing
     until "Add note" was clicked, so typing and then asking for changes closed
     the round with the text discarded and no way back. On a sign-off product
     the reason IS the deliverable, so an unsent draft is sent first and the
     round only closes if it lands. */
  const sendChangeRequest = () => {
    setSendFailed(false);
    const closeRound = () =>
      resolve.mutate(
        { token, status: "CHANGES_REQUESTED" },
        {
          onSuccess: () => {
            setView("auto");
            void utils.clientReview.get.invalidate();
          },
          onError: () => setSendFailed(true),
        },
      );
    const note = draft.trim();
    if (!note) return closeRound();
    comment.mutate(
      { token, body: note },
      {
        onSuccess: () => {
          setDraft("");
          void utils.clientReview.comments.invalidate({ token });
          closeRound();
        },
        onError: () => setSendFailed(true),
      },
    );
  };

  const notesPanel = (
    <aside className="flex h-[500px] w-[320px] shrink-0 flex-col rounded-lg border border-[#E5E7EB] bg-white p-4">
      <p className="text-[13px] font-medium text-[#111827]">Your notes</p>
      {comments.data && comments.data.length > 0 ? (
        <ul className="mt-3 flex max-h-[180px] flex-col gap-2 overflow-y-auto">
          {comments.data.map((c) => (
            <li key={c.id} className="rounded-md bg-[#F3F4F6] px-3 py-3 text-[13px] leading-5 text-[#111827]">
              <p className="whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Anything you'd like changed?"
        aria-label="Your note"
        maxLength={2000}
        className="mt-3 h-[72px] w-full resize-none rounded-md border border-[#D1D5DB] px-3 py-2 text-[13px] text-[#111827] outline-none focus:border-[#1A56DB]"
      />
      <Button className="mt-3 tw:w-full" onClick={addNote} disabled={!draft.trim() || comment.isPending}>
        {comment.isPending ? "Sending…" : "Add note"}
      </Button>
      {comment.error && !sendFailed ? (
        <p className="mt-2 text-[12px] text-[#E02424]">{comment.error.message}</p>
      ) : null}
      {open && !draft.trim() && !(comments.data && comments.data.length > 0) ? (
        /* No board draws an empty notes list (they all show notes). Sending
           a change request with none means the designer is not told what to
           change — say so, as the old confirm did. */
        <p className="mt-3 text-[12px] leading-5 text-[#6B7280]">
          Your designer will not be told what to change unless you add a note.
        </p>
      ) : null}
      {sendFailed ? (
        <div role="alert" className="mt-3 rounded-md bg-[#FDE8E8] px-3 py-3">
          <p className="text-[13px] font-medium text-[#C81E1E]">Your change request wasn&rsquo;t sent.</p>
          <p className="mt-1 text-[12px] leading-5 text-[#4B5563]">
            Nothing was lost — your notes are still here. Check your connection and send again.
          </p>
        </div>
      ) : null}
    </aside>
  );

  /* B · commenting — the page shrunk beside the notes (4418:121999). While the
     round is open the notes lead to "Send change request"; once it is closed
     (C's "Add another note") there is nothing left to send, only a way back. */
  if (view === "notes") {
    return (
      <Shell agency={agency} crumb={signedCrumb} round={`Review round ${round}`}>
        <div className="mx-auto flex w-full max-w-[1050px] flex-col pt-6">
          <div className="flex gap-8">
            <section className="flex h-[500px] flex-1 justify-center rounded-lg bg-white pt-2">
              <SnapshotFrame page={activePage} scale={0.55} height={420} />
            </section>
            {notesPanel}
          </div>
          <div className="mt-8 flex items-center gap-3 pl-4">
            <Button
              variant="ghost"
              size="sm"
              className={`${TEXT_ACTION} ${COMPACT}`}
              onClick={() => setView("auto")}
            >
              {open ? "Back to design" : "Back"}
            </Button>
            {open ? (
              <Button
                size="sm"
                className={`${COMPACT} ${sendFailed ? "tw:min-w-[152px]" : ""}`}
                onClick={sendChangeRequest}
                disabled={resolve.isPending || comment.isPending}
              >
                {comment.isPending || resolve.isPending
                  ? "Sending…"
                  : sendFailed
                    ? "Send again"
                    : "Send change request"}
              </Button>
            ) : null}
          </div>
        </div>
      </Shell>
    );
  }

  // D · approved, E · approved but edited since, C · changes requested. Terminal
  // for the client; E exists because "approved" stops being true the moment the
  // designer touches the page again, and pretending otherwise is how a client
  // ends up feeling they signed off on something they never saw.
  if (!open && view === "auto") {
    const approved = data.status === "APPROVED";
    return (
      /* No snapshot on this screen, so the page is named, not switchable. */
      <Shell
        agency={agency}
        crumb={crumbOf(data.siteName, activePage ? pageLabel(activePage.path) : "Home", `Signed as ${reviewer.name}`)}
        round={approved ? `Round ${round}` : `Review round ${round}`}
      >
        <Card>
          <CardText
            title={approved ? "You approved this" : "You asked for changes"}
            body={
              approved
                ? data.editedSinceApproval
                  ? /* State E. The payload carries the flag since 2026-08-28;
                       without it a returning client was congratulated about a
                       version that no longer exists. */
                    `Heads up — ${agency} has made changes since you approved. If you were sent a new link, use that one; your approval covered the version you saw.`
                  : `Thanks — ${agency} can take it from here. You'll hear from your designer when it goes live.`
                : "Your notes are with your designer. They'll send a new link when the changes are ready for you."
            }
          />
          <div className="mt-4 flex gap-3">
            <Button variant="ghost" size="sm" className={`${TEXT_ACTION} ${COMPACT}`} onClick={() => setView("snapshot")}>
              {approved ? "View what you approved" : "View the design"}
            </Button>
            {approved ? null : (
              <Button size="sm" className={COMPACT} onClick={() => setView("notes")}>
                Add another note
              </Button>
            )}
          </div>
        </Card>
      </Shell>
    );
  }

  // A · viewing (4418:121903) — and, for a closed round, the same snapshot with
  // only a way back. The client must see the SNAPSHOT frozen when the link was
  // sent, not the live draft (contracts §1.6), so this cannot embed the site.
  const approveLine = `${reviewer.name} · Approve Round ${round}${data.changeSummary ? `: ${data.changeSummary}` : "."}`;
  return (
    <Shell
      agency={agency}
      crumb={crumbOf(data.siteName, pageCrumb, open ? "Review snapshot" : `Signed as ${reviewer.name}`)}
      round={`Review round ${round}`}
      footer={
        <div className="mx-auto flex w-full max-w-[1100px] items-center gap-3">
          <p className="flex-1 text-[12px] leading-5 text-[#4B5563]">
            {open
              ? `${approveLine} Approval applies to this sent snapshot only — later draft edits are excluded.`
              : `Signed as ${reviewer.name} · the version sent to you ${new Date(data.sentAt).toLocaleDateString()}.`}
          </p>
          {open ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setView("notes")} disabled={resolve.isPending}>
                Request changes
              </Button>
              <Button size="sm" className="tw:min-w-[157px]" onClick={() => setConfirmApprove(true)} disabled={resolve.isPending}>
                Approve Round {round}
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setView("auto")}>
              Back
            </Button>
          )}
        </div>
      }
    >
      <div className="mt-4 mb-3 flex-1 bg-white pt-4">
        <SnapshotFrame page={activePage} height={600} />
      </div>

      {/* Approval is the signature the whole product exists to collect, so it
          is the one action that asks twice — and the confirm says what it means
          rather than "Are you sure?". No board draws it; the behaviour stays. */}
      <Modal
        open={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        title={`Approve ${data.siteName}?`}
        width={440}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setConfirmApprove(false)}>
              Not yet
            </Button>
            <Button
              disabled={resolve.isPending}
              onClick={() =>
                resolve.mutate(
                  { token, status: "APPROVED" },
                  {
                    onSuccess: () => {
                      setConfirmApprove(false);
                      setView("auto");
                      void utils.clientReview.get.invalidate();
                    },
                  },
                )
              }
            >
              {resolve.isPending ? "Approving…" : "Yes, approve"}
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-[#4B5563]">
          This tells your designer the design is settled and they can put it live. You are approving the
          version you have been looking at.
        </p>
        {resolve.error ? <p className="mt-3 text-[12px] text-[#E02424]">{resolve.error.message}</p> : null}
      </Modal>
    </Shell>
  );
}
