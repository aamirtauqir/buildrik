"use client";

import { Search, Bell, HelpCircle, ChevronDown } from "lucide-react";

export function Topbar() {
  return (
    <header className="fixed left-[220px] right-0 top-0 z-20 flex h-14 items-center justify-between border-b bg-white px-6" style={{ borderColor: "#E8E8E8" }}>
      <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-[#F4F4F4]" style={{ color: "#7A7A7A" }}>
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-4 rounded border px-1.5 py-0.5 text-xs" style={{ borderColor: "#E8E8E8", color: "#B0B0B0" }}>⌘K</kbd>
      </button>
      <div className="flex items-center gap-1">
        <button className="relative rounded-lg p-2 transition-colors hover:bg-[#F4F4F4]" style={{ color: "#7A7A7A" }} aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <button className="rounded-lg p-2 transition-colors hover:bg-[#F4F4F4]" style={{ color: "#7A7A7A" }} aria-label="Help">
          <HelpCircle className="h-5 w-5" />
        </button>
        <button className="ml-2 flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#F4F4F4]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#E42313" }}>U</div>
          <ChevronDown className="h-4 w-4" style={{ color: "#7A7A7A" }} />
        </button>
      </div>
    </header>
  );
}
