"use client";

import { useState } from "react";
import { trpc } from "@lib/trpc/client";

/**
 * Every state of the client review page, per `2026-07-18-j5-signoff-wireframes.md`
 * §S5.5: A0 identify · A viewing · B commenting · C changes requested ·
 * D approved · E post-approval-edited · F dead link.
 *
 * Written for a restaurant owner who got a link from their designer. No account,
 * no jargon, and the two buttons that matter say what happens when you press them.
 */

const DEAD_LINK_COPY: Record<string, { title: string; body: string }> = {
  EXPIRED: {
    title: "This link has expired",
    body: "Review links work for 90 days. Ask your designer to send a new one — your earlier comments are still saved.",
  },
  REVOKED: {
    title: "There's a newer version",
    body: "Your designer sent an updated link, which replaced this one. Check your email for the most recent message.",
  },
  NOT_FOUND: {
    title: "This link doesn't work",
    body: "It may have been copied incompletely. Try clicking the link in your email again rather than pasting it.",
  },
  CONFLICT: {
    title: "You've already answered this",
    body: "This round is closed. If you have more to say, your designer can send a new round.",
  },
};

/** The frozen site, rendered in a fully-sandboxed iframe (no scripts, unique
 *  origin) so the reviewed site's markup can never touch the review page. Shows
 *  the snapshot taken at send, never the live draft (contracts §1.6). Multi-page
 *  snapshots get a tab per page; a missing snapshot degrades to an honest note. */
function SitePreview({ pages }: { pages: { path: string; html: string }[] | null }) {
  const [active, setActive] = useState(0);
  if (!pages || pages.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg border border-dashed border-[#D1D5DB]">
        <p className="text-[13px] text-[#6B7280]">Preview unavailable for this version.</p>
      </div>
    );
  }
  const idx = Math.min(active, pages.length - 1);
  const label = (p: string) => p.replace(/\.html$/, "").replace(/^index$/, "Home") || "Home";
  return (
    <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
      {pages.length > 1 ? (
        <div className="flex gap-1 overflow-x-auto border-b border-[#E5E7EB] bg-[#F9FAFB] px-2 py-1.5">
          {pages.map((p, i) => (
            <button
              key={p.path}
              onClick={() => setActive(i)}
              className={`shrink-0 rounded px-2.5 py-1 text-[12px] ${
                i === idx ? "bg-white font-semibold text-[#111827] shadow-sm" : "text-[#6B7280]"
              }`}
            >
              {label(p.path)}
            </button>
          ))}
        </div>
      ) : null}
      <iframe
        title="Site preview"
        srcDoc={pages[idx].html}
        sandbox=""
        className="h-[600px] w-full bg-white"
      />
    </div>
  );
}

function Shell({
  agency,
  children,
  footer,
}: {
  agency: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      {/* The agency's name leads, not ours. The client hired them, not us. */}
      <header className="h-14 shrink-0 flex items-center gap-3 px-6 bg-white border-b border-[#E5E7EB]">
        <span className="text-[13px] font-semibold text-[#111827]">{agency}</span>
        <span className="text-[12px] text-[#6B7280]">is asking for your feedback</span>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
      {/* Sticky, not static. At 1280x720 the two buttons this page exists for
          sat at y=733 — past the fold, on the one screen size we call the
          minimum. A client who cannot see "Approve" does not approve. */}
      {footer ? (
        <footer className="sticky bottom-0 z-40 shrink-0 border-t border-[#E5E7EB] bg-white px-6 py-4">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-[440px] rounded-lg border border-[#E5E7EB] bg-white p-8">
        {children}
      </div>
    </div>
  );
}

export function ReviewClient({ token }: { token: string }) {
  const review = trpc.clientReview.get.useQuery({ token }, { retry: false });
  const identify = trpc.clientReview.identify.useMutation();
  const comment = trpc.clientReview.comment.useMutation();
  const resolve = trpc.clientReview.resolve.useMutation();
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
  const [asking, setAsking] = useState(false);

  if (review.isLoading) {
    return (
      <Shell agency="Loading">
        <Centered>
          <p className="text-[13px] text-[#6B7280]">Opening your review…</p>
        </Centered>
      </Shell>
    );
  }

  // F · dead link. Four different reasons, four different screens — "expired"
  // and "wrong link" are different problems for the person holding it, and a
  // single "something went wrong" tells them nothing they can act on.
  if (review.error) {
    const code = review.error.data?.code ?? "NOT_FOUND";
    const copy = DEAD_LINK_COPY[code] ?? DEAD_LINK_COPY.NOT_FOUND;
    return (
      <Shell agency="Buildrick">
        <Centered>
          <h1 className="text-[20px] font-semibold text-[#111827]">{copy.title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#4B5563]">{copy.body}</p>
        </Centered>
      </Shell>
    );
  }

  const data = review.data!;
  // The agency (workspace) name leads the header — the client hired them, not us.
  // Falls back to a neutral label if the workspace has no name.
  const agency = data.agencyName ?? "Your design team";
  const signedIn = Boolean(data.reviewer);

  // A0 · first visit. A signature, not a login — there is no password field
  // here and never will be. The email must match the one invited, so an
  // approval carries a name that means something in a dispute six weeks later.
  if (!signedIn) {
    return (
      <Shell agency={agency}>
        <Centered>
          <h1 className="text-[20px] font-semibold text-[#111827]">
            {data.siteName} is ready for you to look at
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#4B5563]">
            Before you start, tell us who you are. This goes on your comments and
            your approval so your designer knows who said what — it is not an
            account, and there is no password.
          </p>
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
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                className="h-9 rounded border border-[#D1D5DB] px-3 text-[13px] outline-none focus:border-[#1A56DB]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-[#4B5563]">
                The email this link was sent to
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={320}
                className="h-9 rounded border border-[#D1D5DB] px-3 text-[13px] outline-none focus:border-[#1A56DB]"
              />
            </label>
            {identify.error ? (
              <p className="text-[12px] text-[#E02424]">{identify.error.message}</p>
            ) : null}
            <button
              type="submit"
              disabled={identify.isPending}
              className="h-10 rounded bg-[#1A56DB] text-[13px] font-semibold text-white disabled:opacity-40"
            >
              {identify.isPending ? "One moment…" : `Look at ${data.siteName}`}
            </button>
          </form>
        </Centered>
      </Shell>
    );
  }

  // D · approved, and E · approved but edited since. Both are terminal for the
  // client; E exists because "approved" stops being true the moment the
  // designer touches the page again, and pretending otherwise is how a client
  // ends up feeling they signed off on something they never saw.
  if (data.status !== "PENDING") {
    const approved = data.status === "APPROVED";
    return (
      <Shell agency={agency}>
        <Centered>
          <h1 className="text-[20px] font-semibold text-[#111827]">
            {approved ? "You approved this" : "You asked for changes"}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#4B5563]">
            {approved
              ? `Thanks — ${agency} can take it from here. You'll hear from your designer when it goes live.`
              : `Your notes are with your designer. They'll send a new link when the changes are ready for you.`}
          </p>
          <p className="mt-4 text-[12px] text-[#6B7280]">
            Signed as {data.reviewer!.name} · {data.reviewer!.email}
          </p>
        </Centered>
      </Shell>
    );
  }

  // A · viewing, B · commenting. The site preview is the remaining piece: the
  // client must see the SNAPSHOT frozen when the link was sent, not the live
  // draft (contracts §1.6), so this cannot just embed the current site.
  return (
    <Shell
      agency={agency}
      footer={
        <div className="mx-auto flex w-full max-w-[1100px] items-center gap-3">
          <p className="flex-1 text-[12px] text-[#6B7280]">
            Signed as {data.reviewer!.name}. You are looking at the version sent to
            you {new Date(data.sentAt).toLocaleDateString()} — later edits will not
            change it.
          </p>
          <button
            onClick={() =>
              resolve.mutate(
                { token, status: "CHANGES_REQUESTED" },
                { onSuccess: () => utils.clientReview.get.invalidate() },
              )
            }
            disabled={resolve.isPending}
            className="h-9 rounded border border-[#D1D5DB] px-4 text-[13px] font-semibold text-[#111827] disabled:opacity-40"
          >
            Ask for changes
          </button>
          <button
            onClick={() => setAsking(true)}
            disabled={resolve.isPending}
            className="h-9 rounded bg-[#1A56DB] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            Approve this design
          </button>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 gap-6 p-6">
        <section className="flex-1 rounded-lg border border-[#E5E7EB] bg-white p-8">
          {data.changeSummary ? (
            <div className="mb-6 rounded-lg bg-[#F3F4F6] px-4 py-3">
              <p className="text-[12px] font-semibold text-[#111827]">What&rsquo;s new</p>
              <p className="mt-1 text-[13px] text-[#4B5563]">{data.changeSummary}</p>
            </div>
          ) : null}
          {/* The site frozen at send, rendered by the editor's ExportEngine and
              stored on the review request. ExportEngine runs in the editor (not
              Next), so the HTML is produced at send time and served here as a
              static, sandboxed snapshot — never the live draft (contracts §1.6). */}
          <SitePreview pages={data.snapshotPages} />
        </section>

        <aside className="w-[320px] shrink-0 rounded-lg border border-[#E5E7EB] bg-white">
          <div className="border-b border-[#E5E7EB] px-4 py-3">
            <p className="text-[13px] font-semibold text-[#111827]">Your notes</p>
          </div>
          <div className="p-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Anything you'd like changed?"
              maxLength={2000}
              className="h-28 w-full resize-none rounded border border-[#D1D5DB] p-3 text-[13px] outline-none focus:border-[#1A56DB]"
            />
            <button
              onClick={() =>
                comment.mutate(
                  { token, body: draft },
                  {
                    onSuccess: () => {
                      setDraft("");
                      // Show the note we just posted — otherwise the page is
                      // write-only and the client can't tell it landed.
                      void utils.clientReview.comments.invalidate({ token });
                    },
                  },
                )
              }
              disabled={!draft.trim() || comment.isPending}
              className="mt-3 h-9 w-full rounded bg-[#1A56DB] text-[13px] font-semibold text-white disabled:opacity-40"
            >
              {comment.isPending ? "Sending…" : "Add note"}
            </button>
            {comment.error ? (
              <p className="mt-2 text-[12px] text-[#E02424]">{comment.error.message}</p>
            ) : null}
            {comments.data && comments.data.length > 0 ? (
              <ul className="mt-4 space-y-3 border-t border-[#E5E7EB] pt-4">
                {comments.data.map((c) => (
                  <li key={c.id} className="text-[13px] leading-relaxed text-[#374151]">
                    <p className="whitespace-pre-wrap">{c.body}</p>
                    <p className="mt-1 text-[11px] text-[#9CA3AF]">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </aside>
      </div>

      {/* Approval is the signature the whole product exists to collect, so it
          is the one action that asks twice — and the confirm says what it means
          rather than "Are you sure?". */}
      {asking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.4)] p-6">
          <div className="w-full max-w-[440px] rounded-lg bg-white p-6">
            <h2 className="text-[16px] font-semibold text-[#111827]">
              Approve {data.siteName}?
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#4B5563]">
              This tells your designer the design is settled and they can put it
              live. You are approving the version you have been looking at.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setAsking(false)}
                className="h-9 rounded border border-[#D1D5DB] px-4 text-[13px] font-semibold text-[#111827]"
              >
                Not yet
              </button>
              <button
                onClick={() =>
                  resolve.mutate(
                    { token, status: "APPROVED" },
                    {
                      onSuccess: () => {
                        setAsking(false);
                        utils.clientReview.get.invalidate();
                      },
                    },
                  )
                }
                disabled={resolve.isPending}
                className="h-9 rounded bg-[#1A56DB] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                {resolve.isPending ? "Approving…" : "Yes, approve"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
