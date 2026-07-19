"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { shareUrl } from "@lib/utils";
import { useToast } from "@/components/dashboard/toast-provider";
import { PLAN_LIMITS, type PlanName } from "@lib/constants/plan-limits";
import { Button, Modal } from "@/components/dashboard/primitives";

interface ShareDraftModalProps {
  open: boolean;
  onClose: () => void;
  siteId: string;
}

const EXPIRY_OPTIONS = [
  { label: "1 day", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "No expiry", days: 0 },
];

export function ShareDraftModal({ open, onClose, siteId }: ShareDraftModalProps) {
  const { addToast } = useToast();
  const [name, setName] = useState("Draft preview");
  const [password, setPassword] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const settingsQuery = trpc.siteDetail.settings.get.useQuery({ siteId }, { enabled: open });
  const plan = (settingsQuery.data as { plan?: string } | undefined)?.plan ?? "FREE";
  const planLimits = PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.FREE;
  const maxExpiryDays = planLimits.shareLinkExpiryMaxDays as number;
  const allowPasswords = !!planLimits.shareLinkPasswords;

  const utils = trpc.useUtils();

  const createMutation = trpc.siteDetail.sharing.create.useMutation({
    onSuccess: (link) => {
      utils.siteDetail.sharing.list.invalidate({ siteId });
      setCreatedUrl(shareUrl(link.token));
    },
    onError: (err) => addToast("error", "Couldn't create draft link", err.message),
  });

  function handleClose() {
    setName("Draft preview");
    setPassword("");
    setExpiryDays("7");
    setCreatedUrl(null);
    setCopied(false);
    onClose();
  }

  function handleCopy() {
    if (!createdUrl) return;
    navigator.clipboard.writeText(`https://${createdUrl}`);
    setCopied(true);
    addToast("success", "Link copied");
  }

  const expiresInDays = expiryDays && expiryDays !== "0" ? Number(expiryDays) : undefined;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Share Draft"
      width={440}
      footer={
        createdUrl ? (
          <Button variant="ghost" onClick={handleClose}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button
              disabled={!name.trim() || (!!password && password.length < 6) || createMutation.isPending}
              onClick={() => createMutation.mutate({ siteId, name: name.trim(), password: password || undefined, expiresInDays })}
            >
              {createMutation.isPending ? "Creating..." : "Create draft link"}
            </Button>
          </>
        )
      }
    >
        {createdUrl ? (
          <>
            <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
              Anyone with this link can preview the current draft.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border-default)" }}>
              <span className="flex-1 truncate text-body font-mono" style={{ color: "var(--color-text-primary)" }}>{createdUrl}</span>
              <Button size="sm" onClick={handleCopy} className="shrink-0 gap-1">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
              Generate a private preview link to share the current draft with clients or teammates.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>Link name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="Draft preview"
                  className="w-full rounded-lg border px-3 py-2 text-body outline-none transition-colors focus:border-[var(--color-primary)]"
                  style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Password{" "}
                  <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>(optional)</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!allowPasswords}
                  placeholder={allowPasswords ? "Min 6 characters" : "Password links require PRO"}
                  className="w-full rounded-lg border px-3 py-2 text-body outline-none transition-colors focus:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>Expiry</label>
                <div className="flex flex-wrap gap-2">
                  {EXPIRY_OPTIONS.map((opt) => {
                    const disabled = opt.days > 0 && maxExpiryDays > 0 && opt.days > maxExpiryDays;
                    const selected = expiryDays === String(opt.days);
                    return (
                      <button
                        key={opt.days}
                        disabled={disabled}
                        onClick={() => setExpiryDays(String(opt.days))}
                        className="rounded-md border px-2.5 py-1 text-body-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          borderColor: selected ? "var(--color-primary)" : "var(--color-border-default)",
                          color: selected ? "var(--color-primary)" : "var(--color-text-secondary)",
                          backgroundColor: selected ? "var(--color-primary-subtle)" : "transparent",
                        }}
                      >
                        {opt.label}{disabled ? " (upgrade)" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
    </Modal>
  );
}
