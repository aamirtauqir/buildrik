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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* The agency's name leads, not ours. The client hired them, not us. */}
      <header className="h-14 shrink-0 flex items-center gap-3 px-6 bg-white border-b border-[#E2E8F0]">
        <span className="text-[13px] font-semibold text-[#0F172A]">{agency}</span>
        <span className="text-[12px] text-[#64748B]">is asking for your feedback</span>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
      {/* Sticky, not static. At 1280x720 the two buttons this page exists for
          sat at y=733 — past the fold, on the one screen size we call the
          minimum. A client who cannot see "Approve" does not approve. */}
      {footer ? (
        <footer className="sticky bottom-0 z-40 shrink-0 border-t border-[#E2E8F0] bg-white px-6 py-4">
          {footer}
        </footer>
      ) : null}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-[440px] rounded-xl border border-[#E2E8F0] bg-white p-8">
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
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [draft, setDraft] = useState("");
  const [asking, setAsking] = useState(false);

  if (review.isLoading) {
    return (
      <Shell agency="Loading">
        <Centered>
          <p className="text-[13px] text-[#64748B]">Opening your review…</p>
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
          <h1 className="text-[20px] font-semibold text-[#0F172A]">{copy.title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#475569]">{copy.body}</p>
        </Centered>
      </Shell>
    );
  }

  const data = review.data!;
  const agency = data.siteName;
  const signedIn = Boolean(data.reviewer);

  // A0 · first visit. A signature, not a login — there is no password field
  // here and never will be. The email must match the one invited, so an
  // approval carries a name that means something in a dispute six weeks later.
  if (!signedIn) {
    return (
      <Shell agency={agency}>
        <Centered>
          <h1 className="text-[20px] font-semibold text-[#0F172A]">
            {data.siteName} is ready for you to look at
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#475569]">
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
              <span className="text-[12px] font-medium text-[#475569]">Your name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                className="h-9 rounded border border-[#CBD5E1] px-3 text-[13px] outline-none focus:border-[#406ED6]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-[#475569]">
                The email this link was sent to
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={320}
                className="h-9 rounded border border-[#CBD5E1] px-3 text-[13px] outline-none focus:border-[#406ED6]"
              />
            </label>
            {identify.error ? (
              <p className="text-[12px] text-[#DC2626]">{identify.error.message}</p>
            ) : null}
            <button
              type="submit"
              disabled={identify.isPending}
              className="h-10 rounded bg-[#406ED6] text-[13px] font-semibold text-white disabled:opacity-40"
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
          <h1 className="text-[20px] font-semibold text-[#0F172A]">
            {approved ? "You approved this" : "You asked for changes"}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#475569]">
            {approved
              ? `Thanks — ${agency} can take it from here. You'll hear from your designer when it goes live.`
              : `Your notes are with your designer. They'll send a new link when the changes are ready for you.`}
          </p>
          <p className="mt-4 text-[12px] text-[#64748B]">
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
          <p className="flex-1 text-[12px] text-[#64748B]">
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
            className="h-9 rounded border border-[#CBD5E1] px-4 text-[13px] font-semibold text-[#0F172A] disabled:opacity-40"
          >
            Ask for changes
          </button>
          <button
            onClick={() => setAsking(true)}
            disabled={resolve.isPending}
            className="h-9 rounded bg-[#406ED6] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            Approve this design
          </button>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 gap-6 p-6">
        <section className="flex-1 rounded-xl border border-[#E2E8F0] bg-white p-8">
          {data.changeSummary ? (
            <div className="mb-6 rounded-lg bg-[#F1F5F9] px-4 py-3">
              <p className="text-[12px] font-semibold text-[#0F172A]">What&rsquo;s new</p>
              <p className="mt-1 text-[13px] text-[#475569]">{data.changeSummary}</p>
            </div>
          ) : null}
          {/* PLACEHOLDER — the snapshot renderer is not wired yet. See the note
              in the commit: SiteVersion.payload holds the frozen ProjectData,
              but turning it into HTML lives in the editor's ExportEngine, which
              has not been proven to run inside Next. Until it is, this page is
              honest about what it cannot show rather than embedding the live
              draft, which would break the frozen-snapshot contract. */}
          <div className="flex h-[420px] items-center justify-center rounded-lg border border-dashed border-[#CBD5E1]">
            <p className="text-[13px] text-[#64748B]">
              Site preview — not wired yet
            </p>
          </div>
        </section>

        <aside className="w-[320px] shrink-0 rounded-xl border border-[#E2E8F0] bg-white">
          <div className="border-b border-[#E2E8F0] px-4 py-3">
            <p className="text-[13px] font-semibold text-[#0F172A]">Your notes</p>
          </div>
          <div className="p-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Anything you'd like changed?"
              maxLength={2000}
              className="h-28 w-full resize-none rounded border border-[#CBD5E1] p-3 text-[13px] outline-none focus:border-[#406ED6]"
            />
            <button
              onClick={() =>
                comment.mutate(
                  { token, body: draft },
                  { onSuccess: () => setDraft("") },
                )
              }
              disabled={!draft.trim() || comment.isPending}
              className="mt-3 h-9 w-full rounded bg-[#406ED6] text-[13px] font-semibold text-white disabled:opacity-40"
            >
              {comment.isPending ? "Sending…" : "Add note"}
            </button>
            {comment.error ? (
              <p className="mt-2 text-[12px] text-[#DC2626]">{comment.error.message}</p>
            ) : null}
          </div>
        </aside>
      </div>

      {/* Approval is the signature the whole product exists to collect, so it
          is the one action that asks twice — and the confirm says what it means
          rather than "Are you sure?". */}
      {asking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.4)] p-6">
          <div className="w-full max-w-[440px] rounded-xl bg-white p-6">
            <h2 className="text-[16px] font-semibold text-[#0F172A]">
              Approve {agency}?
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#475569]">
              This tells your designer the design is settled and they can put it
              live. You are approving the version you have been looking at.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setAsking(false)}
                className="h-9 rounded border border-[#CBD5E1] px-4 text-[13px] font-semibold text-[#0F172A]"
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
                className="h-9 rounded bg-[#406ED6] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
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
