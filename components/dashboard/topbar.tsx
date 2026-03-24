"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { AvatarDropdown } from "./avatar-dropdown";
import { ContextualHelp } from "@/components/help/contextual-help";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { CommandPalette } from "@/components/search/command-palette";

export function Topbar() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="fixed left-[220px] right-0 top-0 z-20 flex h-14 items-center justify-between border-b bg-white px-6" style={{ borderColor: "#E8E8E8" }}>
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-[#F4F4F4]"
          style={{ color: "#7A7A7A" }}
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="ml-4 rounded border px-1.5 py-0.5 text-xs" style={{ borderColor: "#E8E8E8", color: "#B0B0B0" }}>⌘K</kbd>
        </button>
        <div className="flex items-center gap-1">
          <NotificationDropdown />
          <ContextualHelp />
          <AvatarDropdown initials="U" name="User" email="user@example.com" />
        </div>
      </header>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
