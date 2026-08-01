/**
 * Configures flowbite-react's global class-name prefix so every className it
 * renders carries the `tw:` prefix Tailwind emits from src/themes/tw.css
 * (spec §4.1 — prefixed, preflight-free; the canvas mounts customer HTML+CSS
 * in this same document, so chrome utilities must never collide with it).
 *
 * flowbite-react resolves each component's theme classes at render time via
 * resolveTheme() (flowbite-react/dist/helpers/resolve-theme.js), which reads
 * this module's store synchronously through getPrefix()/getVersion()
 * (flowbite-react/store). There is no React context involved — it is a
 * plain in-memory singleton — so this module only needs to be imported (for
 * its setStore side effect) before the first flowbite-react component
 * mounts. `version: 4` must be set explicitly: the store's own runtime
 * default is `undefined`, not the "@default 4" the type comment implies —
 * with prefix set but version undefined, resolveTheme's prefix branch never
 * fires and classes render unprefixed.
 *
 * @license BSD-3-Clause
 */
import { setStore } from "flowbite-react/store";

setStore({ prefix: "tw", version: 4 });
