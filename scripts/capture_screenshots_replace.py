"""Single-session: apply template 1 (direct), then apply template 2 (Replace modal)."""

import json
from pathlib import Path
from playwright.sync_api import sync_playwright, Page

BASE_URL = "http://localhost:5173"
OUTPUT_DIR = Path(__file__).parent / "latest-screenshots"
VIEWPORT = {"width": 1440, "height": 900}
manifest_path = OUTPUT_DIR / "manifest.json"


def shoot(page: Page, fn: str, clip=None) -> None:
    page.wait_for_timeout(500)
    kwargs = {"path": str(OUTPUT_DIR / fn), "timeout": 8000}
    if clip:
        kwargs["clip"] = clip
    page.screenshot(**kwargs)
    print(f"  ✓ {fn}")


def add_manifest(fn: str, section: str, state: str, how: str) -> None:
    try:
        data = json.loads(manifest_path.read_text())
    except Exception:
        data = []
    for i, item in enumerate(data):
        if item["file"] == fn:
            data[i] = {"file": fn, "section": section, "state": state, "how_to_reproduce": how}
            manifest_path.write_text(json.dumps(data, indent=2))
            return
    data.append({"file": fn, "section": section, "state": state, "how_to_reproduce": how})
    manifest_path.write_text(json.dumps(data, indent=2))


def wait_for_rail(page: Page, timeout_ms: int = 15000) -> bool:
    """Wait until the editor rail is fully rendered."""
    try:
        page.wait_for_selector('[id="rail-tab-templates"]', timeout=timeout_ms)
        return True
    except Exception:
        return False


def click_rail(page: Page, tab_id: str) -> None:
    page.click(f'[id="rail-tab-{tab_id}"]', timeout=8000)
    page.wait_for_timeout(800)


def enter_editor(page: Page) -> None:
    page.goto(BASE_URL, wait_until="commit", timeout=30000)
    page.wait_for_timeout(2000)
    try:
        page.click("text=Open", timeout=5000)
        page.wait_for_timeout(2000)
    except Exception:
        pass
    # Wait for rail to be ready
    ok = wait_for_rail(page, timeout_ms=10000)
    print(f"  Rail ready: {ok}")
    page.wait_for_timeout(1000)


def select_and_apply_template(page: Page, card_index: int = 0) -> bool:
    """Select a free template card by index and click 'Use This →'. Returns True if applied."""
    cards = page.evaluate("""() => {
        return Array.from(document.querySelectorAll('.tcard:not(.tcard--locked)')).map(c => ({
            aria: c.getAttribute('aria-label') || '',
            x: Math.round(c.getBoundingClientRect().x),
            y: Math.round(c.getBoundingClientRect().y),
            w: Math.round(c.getBoundingClientRect().width),
            h: Math.round(c.getBoundingClientRect().height)
        }));
    }""")
    if not cards or card_index >= len(cards):
        print(f"  No card at index {card_index}")
        return False

    c = cards[card_index]
    print(f"  Selecting card {card_index}: {c['aria']} at ({c['x']},{c['y']})")

    # Click bottom-right area of card to avoid preview button (which is at top-left)
    cx = c["x"] + c["w"] - 15
    cy = c["y"] + c["h"] - 15
    page.mouse.click(cx, cy)
    page.wait_for_timeout(600)

    nudge = page.evaluate("""() => {
        const btn = document.querySelector('.tpl-nudge-btn');
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return {x: r.x, y: r.y, w: r.width, h: r.height, disabled: btn.disabled, text: btn.textContent.trim()};
    }""")
    print(f"  Nudge btn: {nudge}")

    if not nudge or nudge.get("disabled"):
        return False

    page.mouse.click(nudge["x"] + nudge["w"]//2, nudge["y"] + nudge["h"]//2)
    page.wait_for_timeout(2000)
    return True


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, slow_mo=30)
        ctx = browser.new_context(viewport=VIEWPORT, reduced_motion="reduce", color_scheme="dark")
        page = ctx.new_page()

        print("\n--- Entering editor ---")
        enter_editor(page)

        canvas_count = page.evaluate("""() =>
            Array.from(document.querySelectorAll('[data-aqb-type]')).filter(el => {
                const r = el.getBoundingClientRect();
                return r.width > 5 && r.height > 5;
            }).length
        """)
        print(f"  Canvas on start: {canvas_count} elements")

        # ── Step 1: Apply FIRST template (canvas empty → direct apply, no Replace modal) ──
        print("\n[1] Apply first template")
        try:
            click_rail(page, "templates")
            applied = select_and_apply_template(page, card_index=0)
            print(f"  Applied: {applied}")

            if applied:
                # Check for Replace modal
                modal = page.evaluate("""() => {
                    const selectors = ['.tmpl-replace-modal', '[class*="replace-modal"]', '[role="dialog"]'];
                    for (const sel of selectors) {
                        const el = document.querySelector(sel);
                        if (el && el.getBoundingClientRect().width > 50)
                            return {found: true, cls: el.className.toString().slice(0, 60)};
                    }
                    return {found: false};
                }""")
                print(f"  Modal after apply 1: {modal}")

                if modal.get("found"):
                    # Canvas had content? Close and continue
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(800)

                canvas_count2 = page.evaluate("""() =>
                    Array.from(document.querySelectorAll('[data-aqb-type]')).filter(el => {
                        const r = el.getBoundingClientRect();
                        return r.width > 5 && r.height > 5;
                    }).length
                """)
                print(f"  Canvas after template 1: {canvas_count2} elements")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── Step 2: Apply SECOND template (canvas now has content → Replace modal) ──
        print("\n[2] Apply second template — expect Replace modal")
        try:
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
            click_rail(page, "templates")
            page.wait_for_timeout(600)

            canvas_before = page.evaluate("""() =>
                Array.from(document.querySelectorAll('[data-aqb-type]')).filter(el => {
                    const r = el.getBoundingClientRect();
                    return r.width > 5 && r.height > 5;
                }).length
            """)
            print(f"  Canvas before 2nd apply: {canvas_before} elements")

            applied2 = select_and_apply_template(page, card_index=1)
            print(f"  Applied 2: {applied2}")

            if applied2:
                # Check for Replace modal
                modal2 = page.evaluate("""() => {
                    const selectors = ['.tmpl-replace-modal', '[class*="replace-modal"]', '[class*="ReplaceModal"]', '[role="dialog"]'];
                    for (const sel of selectors) {
                        const el = document.querySelector(sel);
                        if (el) {
                            const r = el.getBoundingClientRect();
                            if (r.width > 50 && r.height > 50) {
                                return {
                                    found: true, sel,
                                    cls: el.className.toString().slice(0, 80),
                                    text: el.textContent.trim().slice(0, 100),
                                    buttons: Array.from(el.querySelectorAll('button')).map(b => ({
                                        text: b.textContent.trim().slice(0, 25),
                                        x: Math.round(b.getBoundingClientRect().x),
                                        y: Math.round(b.getBoundingClientRect().y),
                                        w: Math.round(b.getBoundingClientRect().width),
                                        h: Math.round(b.getBoundingClientRect().height)
                                    }))
                                };
                            }
                        }
                    }
                    return {found: false};
                }""")
                print(f"  Modal after apply 2: {modal2}")

                if modal2.get("found"):
                    shoot(page, "0137-templates-replace-modal.png")
                    add_manifest("0137-templates-replace-modal.png", "Templates", "Template Replace confirmation modal", "Canvas has content → select new template → click 'Use This →' → Replace modal")
                    print("  ✓ Replace modal captured!")

                    # Get progress overlay by confirming Replace
                    for btn in modal2.get("buttons", []):
                        text_lc = btn["text"].lower()
                        if any(kw in text_lc for kw in ["replac", "apply", "confirm", "yes", "use"]):
                            page.mouse.click(btn["x"] + btn["w"]//2, btn["y"] + btn["h"]//2)
                            page.wait_for_timeout(300)

                            # Check for progress overlay
                            overlay = page.evaluate("""() => {
                                const ov = document.querySelector('[class*="apply-progress"], [class*="ApplyProgress"], [class*="progress-overlay"]');
                                if (ov) {
                                    const r = ov.getBoundingClientRect();
                                    return {found: r.width > 50, cls: ov.className.toString()};
                                }
                                return {found: false};
                            }""")
                            print(f"  Progress overlay: {overlay}")

                            if overlay.get("found"):
                                shoot(page, "0139-templates-apply-progress.png")
                                add_manifest("0139-templates-apply-progress.png", "Templates", "Template apply progress overlay", "Confirm Replace → progress overlay while applying template")
                            break
                    else:
                        page.keyboard.press("Escape")

                    page.wait_for_timeout(2000)
                else:
                    print("  → No Replace modal. Check TemplatesTab source for canvasHasContent() logic.")
                    shoot(page, "0137-templates-replace-modal.png")
                    add_manifest("0137-templates-replace-modal.png", "Templates", "Templates — use template button (replace modal not triggered)", "Template selected with canvas content")
        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.press("Escape")

        browser.close()

    # Update manifest + README
    import time, glob as gl

    data = json.loads(manifest_path.read_text())
    all_pngs = sorted(OUTPUT_DIR.glob("*.png"), key=lambda p: p.name)
    existing = {item["file"]: item for item in data}
    final = []
    for png in all_pngs:
        fn = png.name
        if fn in existing:
            final.append(existing[fn])
        else:
            base = fn.replace(".png", "").replace("-", " ")
            final.append({"file": fn, "section": "Unknown", "state": base, "how_to_reproduce": f"Screenshot of: {base}"})

    manifest_path.write_text(json.dumps(final, indent=2))

    sections = {}
    for item in final:
        sections.setdefault(item.get("section", "Other"), []).append(item)

    section_order = [
        "Entry", "Topbar", "Left Rail", "Left Sidebar", "Templates", "Pages",
        "Media", "Design System", "Settings", "Publish",
        "Canvas Footer", "Canvas", "Inspector", "Modals", "Notifications",
        "Empty States", "History", "Layers", "Editor", "Unknown", "Other",
    ]
    ordered = {}
    for s in section_order:
        if s in sections:
            ordered[s] = sections.pop(s)
    for s, items in sections.items():
        ordered[s] = items

    lines = [
        "# Aquibra Editor — Complete Screenshot Library",
        "",
        f"> **Total screenshots:** {len(final)}  ",
        f"> **Generated:** {time.strftime('%Y-%m-%d %H:%M')}  ",
        f"> **Viewport:** 1440×900 · Chromium headless · Dark mode",
        "",
        "---", "",
        "## Quick Index", "",
    ]
    for section, items in ordered.items():
        anchor = section.lower().replace(" ", "-").replace("/", "")
        lines.append(f"- [{section} ({len(items)})](#{anchor})")
    lines += ["", "---", ""]

    for section, items in ordered.items():
        lines.append(f"## {section}")
        lines.append("")
        lines.append("| File | State | How to Reproduce |")
        lines.append("|------|-------|-----------------|")
        for item in items:
            lines.append(f"| [`{item['file']}`]({item['file']}) | {item['state']} | {item['how_to_reproduce']} |")
        lines.append("")

    readme_path = OUTPUT_DIR / "README.md"
    readme_path.write_text("\n".join(lines))

    pngs = gl.glob(str(OUTPUT_DIR / "*.png"))
    print(f"\n{'='*60}")
    print(f"REPLACE PASS COMPLETE! {len(final)} manifest entries, {len(pngs)} PNGs")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
