import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { render, type RenderResult } from "@testing-library/react";
import { MediaTab } from "../../MediaTab";
import { mockComposer } from "./mockComposer";

interface RenderOpts {
  composerOpts?: Parameters<typeof mockComposer>[0];
  onOpenLibrary?: (opts?: { searchQuery?: string; folderId?: string | null }) => void;
}

export function renderMediaTab(opts: RenderOpts = {}): RenderResult {
  return render(
    <ToastProvider>
      <MediaTab composer={mockComposer(opts.composerOpts)} onOpenLibrary={opts.onOpenLibrary ?? (() => {})} />
    </ToastProvider>,
  );
}
