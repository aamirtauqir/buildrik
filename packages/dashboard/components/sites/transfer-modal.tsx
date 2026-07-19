"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { Button, Modal } from "@/components/dashboard/primitives";

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  siteId: string;
  siteName: string;
}

export function TransferModal({ open, onClose, siteId, siteName }: TransferModalProps) {
  const { addToast } = useToast();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const membersQuery = trpc.team.list.useQuery(
    { page: 1, perPage: 50 },
    { enabled: open }
  );

  const utils = trpc.useUtils();

  const transferMutation = trpc.sites.transfer.useMutation({
    onSuccess: () => {
      utils.sites.list.invalidate();
      addToast("success", "Site transferred successfully");
      onClose();
    },
    onError: (err) => addToast("error", "Transfer failed", err.message),
  });

  const eligibleMembers = (membersQuery.data?.data ?? []).filter(
    (m) => m.role === "ADMIN" || m.role === "EDITOR"
  );

  const selectedMember = eligibleMembers.find(
    (m) => m.userId === selectedMemberId
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transfer Site"
      width={440}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selectedMemberId || transferMutation.isPending}
            onClick={() => transferMutation.mutate({ siteId, newOwnerId: selectedMemberId })}
          >
            {transferMutation.isPending ? "Transferring..." : "Transfer"}
          </Button>
        </>
      }
    >
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Select a team member to transfer ownership of this site.
      </p>

      {/* Member dropdown */}
      <div className="relative mt-4">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border-default)", color: selectedMember ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
        >
          {selectedMember ? selectedMember.fullName : "Select a member..."}
          <ChevronDown className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
        </button>
        {dropdownOpen && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-white shadow-lg" style={{ borderColor: "var(--color-border-default)" }}>
            {membersQuery.isLoading && (
              <p className="px-3 py-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
            )}
            {eligibleMembers.length === 0 && !membersQuery.isLoading && (
              <p className="px-3 py-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>No eligible members</p>
            )}
            {eligibleMembers.map((member) => (
              <button
                key={member.userId}
                onClick={() => { setSelectedMemberId(member.userId); setDropdownOpen(false); }}
                className="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-[var(--color-bg-subtle)]"
                style={{ color: "var(--color-text-primary)" }}
              >
                <span>{member.fullName}</span>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{member.role.toLowerCase()}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation text */}
      {selectedMember && (
        <p className="mt-4 rounded-lg p-3 text-sm" style={{ backgroundColor: "#FEF9C3", color: "#854D0E" }}>
          Transfer ownership of &apos;{siteName}&apos; to {selectedMember.fullName}. You will become an Editor on this site.
        </p>
      )}
    </Modal>
  );
}
