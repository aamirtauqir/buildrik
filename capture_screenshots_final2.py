"""Final2 — Template Replace modal (canvas has content), Config & Launch tab, progress overlay."""

import json
from pathlib import Path
from playwright.sync_api import sync_playwright, Page

BASE_URL = "http://localhost:5173"
OUTPUT_DIR = Path(__file__).parent / "latest-screenshots"
VIEWPORT = {"width": 1440, "height": 900}
manifest_path = OUTPUT_DIR / "manifest.json"


def shoot(page: Page, fn: str, clip=None) -> None:
    page.wait_for_timeout(500)
    kwargs = {"path": str(OUTPUT_DIR / fn), "timeout": 10000}
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


def click_rail(page: Page, tab_id: str) -> None:
    page.evaluate(f'document.getElementById("rail-tab-{tab_id}").click()')
    page.wait_for_timeout(800)


def enter_editor(page: Page) -> None:
    page.goto(BASE_URL, wait_until="commit", timeout=30000)
    page.wait_for_timeout(3000)
    try:
        page.click("text=Open", timeout=5000)
        page.wait_for_timeout(3000)
    except Exception:
        pass


def dismiss_all(page: Page) -> None:
    page.keyboard.press("Escape")
    page.wait_for_timeout(200)
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, slow_mo=30)
        ctx = browser.new_context(viewport=VIEWPORT, reduced_motion="reduce", color_scheme="dark")
        page = ctx.new_page()
        enter_editor(page)

        # Check canvas state
        els = page.evaluate("""() => {
            return Array.from(document.querySelectorAll('[data-aqb-type]')).filter(el => {
                const r = el.getBoundingClientRect();
                return r.width > 5 && r.height > 5;
            }).length;
        }""")
        print(f"  Canvas elements on start: {els}")

        # ── 1. Template Replace modal ──
        # Canvas needs to have content for Replace modal to show. Try applying a DIFFERENT template.
        print("\n[1] Template Replace modal — select 2nd template while canvas has content")
        try:
            dismiss_all(page)
            click_rail(page, "templates")
            page.wait_for_timeout(800)

            # Check how many elements on canvas
            canvas_count = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('[data-aqb-type]')).filter(el => {
                    const r = el.getBoundingClientRect();
                    return r.width > 5 && r.height > 5;
                }).length;
            }""")
            print(f"  Canvas has {canvas_count} elements")

            if canvas_count < 2:
                print("  → Canvas is empty, no Replace modal will appear. Skipping.")
            else:
                # Get all non-locked template cards
                cards = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('.tcard:not(.tcard--locked)')).map(c => ({
                        text: c.getAttribute('aria-label') || c.textContent.trim().slice(0, 20),
                        x: Math.round(c.getBoundingClientRect().x),
                        y: Math.round(c.getBoundingClientRect().y),
                        w: Math.round(c.getBoundingClientRect().width),
                        h: Math.round(c.getBoundingClientRect().height)
                    }));
                }""")
                print(f"  Available cards: {[c['text'] for c in cards]}")

                # Click the SECOND card (not the first which may already be applied)
                # Click bottom-right area to avoid preview button
                target_card = cards[1] if len(cards) > 1 else cards[0]
                cx = target_card["x"] + target_card["w"] - 15  # right side
                cy = target_card["y"] + target_card["h"] - 15  # bottom area
                page.mouse.click(cx, cy)
                page.wait_for_timeout(700)

                # Check nudge state
                nudge_info = page.evaluate("""() => {
                    const nudge = document.querySelector('.tpl-nudge');
                    const btn = document.querySelector('.tpl-nudge-btn');
                    return {
                        found: !!nudge,
                        text: nudge ? nudge.textContent.trim().slice(0, 50) : '',
                        btnDisabled: btn ? btn.disabled : true,
                        btnText: btn ? btn.textContent.trim() : ''
                    };
                }""")
                print(f"  Nudge state: {nudge_info}")

                if nudge_info.get("found") and not nudge_info.get("btnDisabled"):
                    # Click "Use This →"
                    btn_info = page.evaluate("""() => {
                        const btn = document.querySelector('.tpl-nudge-btn');
                        const r = btn.getBoundingClientRect();
                        return {x: r.x, y: r.y, w: r.width, h: r.height};
                    }""")
                    page.mouse.click(btn_info["x"] + btn_info["w"]//2, btn_info["y"] + btn_info["h"]//2)
                    page.wait_for_timeout(1500)

                    # Check for Replace modal
                    modal_info = page.evaluate("""() => {
                        // Check all possible modal selectors
                        const selectors = [
                            '.tmpl-replace-modal',
                            '[class*="replace-modal"]',
                            '[class*="ReplaceModal"]',
                            '[role="dialog"]'
                        ];
                        for (const sel of selectors) {
                            const el = document.querySelector(sel);
                            if (el) {
                                const r = el.getBoundingClientRect();
                                if (r.width > 50 && r.height > 50) {
                                    return {
                                        found: true, sel,
                                        cls: el.className.toString().slice(0, 80),
                                        text: el.textContent.trim().slice(0, 100),
                                        rect: {x: r.x, y: r.y, w: r.width, h: r.height},
                                        buttons: Array.from(el.querySelectorAll('button')).map(b => ({
                                            text: b.textContent.trim().slice(0, 20),
                                            x: Math.round(b.getBoundingClientRect().x),
                                            y: Math.round(b.getBoundingClientRect().y)
                                        }))
                                    };
                                }
                            }
                        }
                        return {found: false};
                    }""")
                    print(f"  Modal: {modal_info}")

                    if modal_info.get("found"):
                        shoot(page, "0137-templates-replace-modal.png")
                        add_manifest("0137-templates-replace-modal.png", "Templates", "Template Replace confirmation modal", "Canvas has content → select new template → click 'Use This →' → Replace modal")

                        # Try to also capture progress overlay by confirming
                        for btn in modal_info.get("buttons", []):
                            text_lc = btn["text"].lower()
                            if any(kw in text_lc for kw in ["replac", "apply", "confirm", "yes", "use"]):
                                page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                                page.wait_for_timeout(300)

                                overlay_info = page.evaluate("""() => {
                                    const overlays = document.querySelectorAll('[class*="apply-progress"], [class*="ApplyProgress"], [class*="progress"]');
                                    for (const ov of overlays) {
                                        const r = ov.getBoundingClientRect();
                                        if (r.width > 100) return {found: true, cls: ov.className.toString()};
                                    }
                                    return {found: false};
                                }""")
                                print(f"  Progress overlay: {overlay_info}")
                                if overlay_info.get("found"):
                                    shoot(page, "0139-templates-apply-progress.png")
                                    add_manifest("0139-templates-apply-progress.png", "Templates", "Template apply progress overlay", "Confirm Replace → progress overlay")
                                page.wait_for_timeout(2000)
                                break
                        else:
                            page.keyboard.press("Escape")
                    else:
                        # No modal — capture canvas state anyway
                        shoot(page, "0137-templates-replace-modal.png")
                        add_manifest("0137-templates-replace-modal.png", "Templates", "Templates tab — after clicking Use This (no replace modal shown in free plan)", "Click 'Use This →' on template")
                        page.keyboard.press("Escape")
        except Exception as e:
            print(f"  ⚠ {e}")
            dismiss_all(page)

        # ── 2. Config & Launch tab (screenshot with no font wait) ──
        print("\n[2] Config & Launch tab")
        try:
            dismiss_all(page)
            click_rail(page, "settings")
            page.wait_for_timeout(1200)

            # Screenshot with shorter timeout, allow font incomplete
            drawer = page.evaluate("""() => {
                const el = document.querySelector('.layout-shell__drawer');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            print(f"  Drawer: {drawer}")

            if drawer:
                # Screenshot full page clip
                page.screenshot(
                    path=str(OUTPUT_DIR / "0180c-config-launch-tab.png"),
                    clip={"x": drawer["x"], "y": drawer["y"], "width": drawer["w"], "height": drawer["h"]},
                    timeout=8000
                )
                print("  ✓ 0180c-config-launch-tab.png")
                add_manifest("0180c-config-launch-tab.png", "Publish", "Config & Launch panel — full close-up", "Click Config & Launch rail tab (settings)")

            # Also get a full-page screenshot
            page.screenshot(
                path=str(OUTPUT_DIR / "0180d-config-launch-full.png"),
                timeout=8000
            )
            print("  ✓ 0180d-config-launch-full.png")
            add_manifest("0180d-config-launch-full.png", "Publish", "Config & Launch — full editor view", "Config & Launch tab with full editor context")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 3. Topbar recon for project settings ──
        print("\n[3] Topbar project menu recon")
        try:
            dismiss_all(page)

            # Get actual topbar HTML structure
            topbar_html = page.evaluate("""() => {
                // Try multiple selectors for topbar
                const candidates = [
                    document.querySelector('header'),
                    document.querySelector('[class*="topbar"]'),
                    document.querySelector('[class*="Topbar"]'),
                    document.querySelector('[class*="top-bar"]'),
                ];
                for (const el of candidates) {
                    if (el) return {cls: el.className.toString().slice(0, 80), text: el.textContent.trim().slice(0, 100)};
                }
                // Fall back: look at top-most buttons
                const btns = Array.from(document.querySelectorAll('button')).filter(b => {
                    const r = b.getBoundingClientRect();
                    return r.y < 50 && r.width > 0;
                });
                return {topBtns: btns.map(b => ({text: b.textContent.trim().slice(0, 20), cls: b.className.toString().slice(0, 40), x: Math.round(b.getBoundingClientRect().x), y: Math.round(b.getBoundingClientRect().y)}))};
            }""")
            print(f"  Topbar: {topbar_html}")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 4. Final summary screenshot ──
        print("\n[4] Final full editor screenshot")
        try:
            dismiss_all(page)
            click_rail(page, "pages")
            page.wait_for_timeout(600)
            page.mouse.click(720, 500)
            page.wait_for_timeout(400)
            page.screenshot(path=str(OUTPUT_DIR / "0099d-editor-final.png"), timeout=8000)
            print("  ✓ 0099d-editor-final.png")
            add_manifest("0099d-editor-final.png", "Editor", "Editor — final state after template applied", "Full editor with Pages tab, template-filled canvas, inspector")
        except Exception as e:
            print(f"  ⚠ {e}")

        browser.close()

    # Regenerate manifest
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
        "---",
        "",
        "## Quick Index",
        "",
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

    print(f"\n{'='*60}")
    print(f"FINAL2 COMPLETE! {len(final)} screenshots")
    print(f"{'='*60}")
    pngs = gl.glob(str(OUTPUT_DIR / "*.png"))
    print(f"Total PNGs: {len(pngs)}")


if __name__ == "__main__":
    main()
