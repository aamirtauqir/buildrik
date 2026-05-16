/**
 * TokensRouter — drill-in stack wrapper around TokensSection accordion.
 *
 * T8 of DS prototype-full-rewrite arc. Owns local view state:
 *   - { kind: "list" }  → render children (the accordion).
 *   - { kind: "detail", tokenId } → render <TokenDetailView/> (replaces list).
 *
 * Children receive `onRowClick(tokenId)` via render prop — each token list
 * wires it to its row container's onClick. Back arrow in TokenDetailView
 * returns to list.
 *
 * Self-heals when the active token disappears from the tokens prop (deleted
 * / renamed elsewhere) — falls back to list view via a queued setState
 * (microtask) rather than mid-render hooks per rules-of-hooks discipline.
 *
 * D3 / D9: state is local to TokensSection — no global router.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine/Composer";
import type { DesignToken } from "../../types";
import { TokenDetailView } from "./TokenDetailView";

type View = { kind: "list" } | { kind: "detail"; tokenId: string };

export interface TokensRouterProps {
  composer: Composer | null | undefined;
  tokens: ReadonlyArray<DesignToken>;
  onTokenChange?: (id: string, value: string) => void;
  onTokenDelete?: (id: string) => void;
  onTokenRename?: (id: string, newId: string) => void;
  children: (handlers: { onRowClick: (tokenId: string) => void }) => React.ReactNode;
}

export const TokensRouter: React.FC<TokensRouterProps> = ({
  composer,
  tokens,
  onTokenChange,
  onTokenDelete,
  onTokenRename,
  children,
}) => {
  const [view, setView] = React.useState<View>({ kind: "list" });

  const onRowClick = React.useCallback(
    (tokenId: string) => setView({ kind: "detail", tokenId }),
    [],
  );

  const onBack = React.useCallback(() => setView({ kind: "list" }), []);

  if (view.kind === "detail") {
    const token = tokens.find((t) => t.id === view.tokenId);
    if (!token) {
      // Token disappeared (deleted / renamed) while in detail. Bail back to
      // list via a queued microtask — calling setView mid-render would warn.
      // Render list now; the queued state update arrives before paint.
      Promise.resolve().then(() => setView({ kind: "list" }));
      return <>{children({ onRowClick })}</>;
    }
    return (
      <TokenDetailView
        token={token}
        composer={composer}
        allTokens={tokens}
        onBack={onBack}
        onValueChange={onTokenChange}
        onDelete={onTokenDelete}
        onRename={onTokenRename}
      />
    );
  }

  return <>{children({ onRowClick })}</>;
};
