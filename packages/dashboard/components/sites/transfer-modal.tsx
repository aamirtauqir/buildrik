"use client";
import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";

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

  if (!open) return null;

  const eligibleMembers = (membersQuery.data?.data ?? []).filter(
    (m) => m.role === "ADMIN" || m.role === "EDITOR"
  );

  const selectedMember = eligibleMembers.find(
    (m) => m.userId === selectedMemberId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "#0000004D" }} onClick={onClose}>
      <div className="w-[440px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>Transfer Site</h2>
          <button onClick={onClose}><X className="h-5 w-5" style={{ color: "#7A7A7A" }} /></button>
        </div>

        <p className="mt-3 text-sm" style={{ color: "#7A7A7A" }}>
          Select a team member to transfer ownership of this site.
        </p>

        {/* Member dropdown */}
        <div className="relative mt-4">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "#E8E8E8", color: selectedMember ? "#0D0D0D" : "#B0B0B0" }}
          >
            {selectedMember ? selectedMember.fullName : "Select a member..."}
            <ChevronDown className="h-4 w-4" style={{ color: "#7A7A7A" }} />
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-white shadow-lg" style={{ borderColor: "#E8E8E8" }}>
              {membersQuery.isLoading && (
                <p className="px-3 py-2 text-sm" style={{ color: "#7A7A7A" }}>Loading...</p>
              )}
              {eligibleMembers.length === 0 && !membersQuery.isLoading && (
                <p className="px-3 py-2 text-sm" style={{ color: "#7A7A7A" }}>No eligible members</p>
              )}
              {eligibleMembers.map((member) => (
                <button
                  key={member.userId}
                  onClick={() => { setSelectedMemberId(member.userId); setDropdownOpen(false); }}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-[#F4F4F4]"
                  style={{ color: "#0D0D0D" }}
                >
                  <span>{member.fullName}</span>
                  <span className="text-xs" style={{ color: "#B0B0B0" }}>{member.role.toLowerCase()}</span>
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

        {/* Actions */}
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}>
            Cancel
          </button>
          <button
            disabled={!selectedMemberId || transferMutation.isPending}
            onClick={() => transferMutation.mutate({ siteId, newOwnerId: selectedMemberId })}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "#E42313" }}
          >
            {transferMutation.isPending ? "Transferring..." : "Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}
