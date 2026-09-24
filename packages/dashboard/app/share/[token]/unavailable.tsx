import type { ShareUnavailableReason } from "@server/services/share-link.service";

/**
 * A share link that cannot open: expired, revoked (or its site deleted), or
 * unknown. There is no share board for this state, so it follows the review
 * link's dead-link card (/review/<token>, state F): a 440px message card 120px
 * under a 56px header, one reason per screen. These used to render the
 * PASSWORD gate — "This site is password protected" for links that have no
 * password.
 */
const COPY: Record<ShareUnavailableReason, { title: string; body: string }> = {
  expired: {
    title: "This link has expired",
    body: "Share links stop working after the time they were set to last. Ask whoever sent it for a new one.",
  },
  revoked: {
    title: "This link is no longer available",
    body: "Whoever shared it has turned it off. Ask them for a new link if you still need to see the site.",
  },
  unknown: {
    title: "This link doesn’t work",
    body: "It may have been copied incompletely. Try opening the link from the original message instead of pasting it.",
  },
};

export function ShareUnavailable({ reason }: { reason: ShareUnavailableReason }) {
  const copy = COPY[reason];
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <header className="h-14 shrink-0 flex items-center px-6 bg-white border-b border-[#E5E7EB]">
        <span className="text-[13px] font-medium text-[#111827]">Buildrick</span>
      </header>
      <main className="flex-1 flex justify-center px-6 pt-[120px]">
        <div
          data-testid={`share-unavailable-${reason}`}
          className="h-fit w-full max-w-[440px] rounded-lg border border-[#E5E7EB] bg-white p-6"
        >
          <h1 className="text-[20px] font-semibold leading-7 text-[#111827]">{copy.title}</h1>
          <p className="mt-1 text-[13px] leading-5 text-[#4B5563]">{copy.body}</p>
        </div>
      </main>
    </div>
  );
}
