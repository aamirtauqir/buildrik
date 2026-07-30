"use client";
import { useState } from "react";
import { Button, InputField, Modal } from "@/components/dashboard/primitives";

interface RenameModalProps {
  open: boolean;
  currentName: string;
  /** Defaults to the site heading; folder renames pass their own. */
  title?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export function RenameModal({ open, currentName, title = "Rename Site", onClose, onSubmit }: RenameModalProps) {
  const [name, setName] = useState(currentName);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={400}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(name)}>Save</Button>
        </>
      }
    >
      <InputField type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
    </Modal>
  );
}
