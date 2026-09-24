/**
 * The Settings Clone dialogs (Add a domain, Add locale, Connection verified,
 * Add/Edit redirect, Remove <domain>?, Translation checklist) draw 640. They
 * render ModalContent size="table", whose class is the token
 * `tw:w-[var(--bk-size-dialog-lg)]` since the dialog-frame parity pass
 * (117a5a13e) — the component tests assert that class; this pins the token
 * to the boards' 640.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Settings dialogs — width/dialog-lg is the boards' 640", () => {
  it("--bk-size-dialog-lg resolves to 640px", () => {
    const css = readFileSync(join(__dirname, "../../../../../../themes/tokens.generated.css"), "utf8");
    expect(css).toMatch(/--bk-size-dialog-lg:\s*640px;/);
  });
});
