/**
 * Configures flowbite-react's global class-name prefix for the dashboard,
 * matching packages/editor's `tw:` prefix (flowbite-bigbang arc).
 *
 * flowbite-react's prefix/version live in a plain module-level singleton
 * (flowbite-react/store — no React context), read synchronously by
 * resolveTheme() at render time (flowbite-react/dist/helpers/resolve-theme.js).
 * packages/editor and packages/dashboard both resolve `flowbite-react` to the
 * SAME physical node_modules install (pnpm content-addressed store, verified
 * identical path) and `next.config.mjs` transpiles the editor package into
 * this app's bundle — so that singleton is shared, not per-package. Before
 * this fix, only the editor called setStore({prefix:"tw"}): opening the
 * unified editor (`NEXT_PUBLIC_UNIFIED_EDITOR=true`, `/edit/:id`) flipped the
 * prefix for the whole browser tab, and because it's a plain JS singleton
 * (not reset on client-side navigation), every dashboard flowbite component
 * rendered `tw:`-prefixed classes the dashboard's own Tailwind build never
 * compiled — unstyled, until a hard refresh.
 *
 * Fix (founder decision, Option A): the dashboard now sets the SAME prefix
 * itself, unconditionally, at load — not only when the editor happens to be
 * present. This makes dashboard flowbite rendering consistent regardless of
 * navigation order, and its Tailwind build (app/globals.css's prefixed
 * `tw-theme`/`tw-utilities` layer, sourced from the `tw:`-prefixed
 * `.flowbite-react/class-list.json`) is compiled to match.
 *
 * Imported for its side effect only — must run before the first
 * flowbite-react component renders, so it is imported first in
 * app/layout.tsx (the app root, evaluated before any route tree).
 */
import { setStore } from "flowbite-react/store";

setStore({ prefix: "tw", version: 4 });
