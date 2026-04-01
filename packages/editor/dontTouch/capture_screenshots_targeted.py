"""Targeted final pass — Replace modal, progress overlay, publish tab, template selection state."""

import json
from pathlib import Path
from playwright.sync_api import sync_playwright, Page

BASE_URL = "http://localhost:5173"
OUTPUT_DIR = Path(__file__).parent / "latest-screenshots"
VIEWPORT = {"width": 1440, "height": 900}
manifest_path = OUTPUT_DIR / "manifest.json"


def shoot(page: Page, fn: str, clip=None) -> None:
    page.wait_for_timeout(700)
    kwargs = {"path": str(OUTPUT_DIR / fn)}
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

        # ── 1. Template selected state + Replace modal ──
        # First: Start Blank to put content on canvas, then switch to template
        print("\n[1] Add canvas content via 'Start Blank'")
        try:
            dismiss_all(page)

            # Check if canvas is empty (has CTA buttons)
            blank_btn = page.evaluate("""() => {
                const btn = document.querySelector('.aqb-canvas-empty-cta__blank, [class*="start-blank"]');
                if (!btn) return null;
                const r = btn.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height, text: btn.textContent.trim()};
            }""")
            print(f"  Start Blank btn: {blank_btn}")

            if blank_btn:
                page.mouse.click(blank_btn["x"] + blank_btn["w"]//2, blank_btn["y"] + blank_btn["h"]//2)
                page.wait_for_timeout(1000)

                # Check canvas state
                canvas_info = page.evaluate("""() => {
                    const els = Array.from(document.querySelectorAll('[data-aqb-type]'));
                    return {count: els.length, types: els.map(el => el.getAttribute('data-aqb-type'))};
                }""")
                print(f"  Canvas after Start Blank: {canvas_info}")
                shoot(page, "0101b-editor-blank-canvas.png")
                add_manifest("0101b-editor-blank-canvas.png", "Editor", "Editor with blank canvas started", "Click 'Start Blank' CTA")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 2. Templates tab: select a card, capture nudge state ──
        print("\n[2] Templates — select card + nudge button state")
        try:
            dismiss_all(page)
            click_rail(page, "templates")
            page.wait_for_timeout(800)

            # Click SaaS Landing card center (avoid preview button at top-left area)
            # Card at x=68, y=225, w=113, h=126; preview btn at x=86, y=250
            # Click bottom half: x=130, y=320
            page.mouse.click(130, 320)
            page.wait_for_timeout(600)

            nudge_info = page.evaluate("""() => {
                const nudge = document.querySelector('.tpl-nudge');
                const btn = document.querySelector('.tpl-nudge-btn');
                if (!nudge) return {found: false};
                return {
                    found: true,
                    nudgeText: nudge.textContent.trim().slice(0, 60),
                    btnText: btn ? btn.textContent.trim() : '',
                    btnDisabled: btn ? btn.disabled : true
                };
            }""")
            print(f"  Nudge after card click: {nudge_info}")

            shoot(page, "0130b-templates-card-selected.png")
            add_manifest("0130b-templates-card-selected.png", "Templates", "Templates tab — card selected, nudge active", "Click template card → nudge bar shows 'Use This →'")

            # Now click "Use This →" nudge button
            if nudge_info.get("found") and not nudge_info.get("btnDisabled"):
                page.mouse.click(213 + 5, 828 + 5)  # tpl-nudge-btn at x=213, y=828
                page.wait_for_timeout(1200)

                # Check what happened
                state_after = page.evaluate("""() => {
                    const modal = document.querySelector('.tmpl-replace-modal, [class*="replace-modal"], [class*="ReplaceModal"]');
                    const dialog = document.querySelector('[role="dialog"]');
                    const overlay = document.querySelector('[class*="apply-progress"], [class*="ApplyProgress"]');
                    const shell = document.querySelector('.tpl-shell');
                    return {
                        hasReplaceModal: !!modal,
                        hasDialog: !!(dialog && dialog.getBoundingClientRect().width > 50),
                        hasProgressOverlay: !!overlay,
                        tplShellCls: shell ? shell.className.toString() : ''
                    };
                }""")
                print(f"  State after 'Use This →': {state_after}")

                if state_after.get("hasReplaceModal") or state_after.get("hasDialog"):
                    shoot(page, "0137-templates-replace-modal.png")
                    add_manifest("0137-templates-replace-modal.png", "Templates", "Template Replace confirmation modal", "Select template → click 'Use This →' → Replace modal appears")

                    # Also get progress overlay by confirming
                    confirm_btn = page.evaluate("""() => {
                        const btns = Array.from(document.querySelectorAll('[role="dialog"] button, .tmpl-replace-modal button'));
                        return btns.map(b => ({
                            text: b.textContent.trim().slice(0, 20),
                            x: Math.round(b.getBoundingClientRect().x),
                            y: Math.round(b.getBoundingClientRect().y)
                        }));
                    }""")
                    print(f"  Dialog buttons: {confirm_btn}")

                    for btn in confirm_btn:
                        if any(kw in btn["text"].lower() for kw in ["replac", "apply", "confirm", "yes"]):
                            page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                            page.wait_for_timeout(400)

                            # Check for progress overlay
                            overlay_info = page.evaluate("""() => {
                                const overlay = document.querySelector('[class*="apply-progress"], [class*="ApplyProgress"], [class*="progress-overlay"]');
                                return overlay ? {found: true, cls: overlay.className.toString()} : {found: false};
                            }""")
                            print(f"  Progress overlay: {overlay_info}")

                            if overlay_info.get("found"):
                                shoot(page, "0139-templates-apply-progress.png")
                                add_manifest("0139-templates-apply-progress.png", "Templates", "Template apply progress overlay", "Confirm Replace → progress overlay shows while applying")

                            page.wait_for_timeout(1500)
                            break
                    else:
                        page.keyboard.press("Escape")
                elif state_after.get("hasProgressOverlay"):
                    shoot(page, "0139-templates-apply-progress.png")
                    add_manifest("0139-templates-apply-progress.png", "Templates", "Template apply progress overlay", "Click 'Use This →' → progress overlay (canvas was empty)")
                    page.wait_for_timeout(2000)
                else:
                    print("  → Template applied directly (canvas was empty, no replace modal needed)")
                    shoot(page, "0100c-editor-after-template-applied.png")
                    add_manifest("0100c-editor-after-template-applied.png", "Editor", "Editor after template applied", "Click 'Use This →' on template — canvas fills with template content")
            else:
                print("  → Nudge btn disabled or not found")
        except Exception as e:
            print(f"  ⚠ {e}")
            dismiss_all(page)

        # ── 3. Config & Launch / Publish tab ──
        print("\n[3] Config & Launch (Publish) tab")
        try:
            dismiss_all(page)
            # Use settings tab (Config & Launch)
            click_rail(page, "settings")
            page.wait_for_timeout(800)

            # Recon the publish panel
            panel_info = page.evaluate("""() => {
                const drawer = document.querySelector('.layout-shell__drawer');
                if (!drawer) return null;
                const r = drawer.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            print(f"  Panel: {panel_info}")

            if panel_info:
                shoot(page, "0180b-publish-config-launch.png", clip={
                    "x": panel_info["x"], "y": panel_info["y"],
                    "width": panel_info["w"], "height": panel_info["h"]
                })
                add_manifest("0180b-publish-config-launch.png", "Publish", "Config & Launch tab — full close-up", "Click Config & Launch rail tab")

                # Look for any sub-sections or buttons
                sub_info = page.evaluate("""() => {
                    const drawer = document.querySelector('.layout-shell__drawer');
                    const cards = Array.from(drawer?.querySelectorAll('[class*="feature-card"], [class*="FeatureCard"], .settings-card') || []);
                    const btns = Array.from(drawer?.querySelectorAll('button') || []).slice(0, 8);
                    return {
                        cards: cards.map(c => c.textContent.trim().slice(0, 30)),
                        btns: btns.map(b => ({text: b.textContent.trim().slice(0, 20), x: Math.round(b.getBoundingClientRect().x), y: Math.round(b.getBoundingClientRect().y)}))
                    };
                }""")
                print(f"  Sub info: {sub_info}")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 4. With template applied — canvas with rich content ──
        print("\n[4] Canvas + inspector with template content")
        try:
            dismiss_all(page)

            # Check how many canvas elements now
            els = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('[data-aqb-type]')).map(el => {
                    const r = el.getBoundingClientRect();
                    return {x: r.x, y: r.y, w: r.width, h: r.height, type: el.getAttribute('data-aqb-type')};
                }).filter(r => r.w > 5 && r.h > 5);
            }""")
            print(f"  Canvas elements after template: {len(els)}")

            if len(els) >= 2:
                # Select one
                e0 = els[0]
                page.mouse.click(e0["x"] + e0["w"]//2, e0["y"] + e0["h"]//2)
                page.wait_for_timeout(500)
                shoot(page, "0301b-canvas-element-selected-rich.png")
                add_manifest("0301b-canvas-element-selected-rich.png", "Canvas", "Canvas element selected — rich template", "Click element in canvas after template applied")

                # Try multiselect
                e1 = els[1] if len(els) > 1 else e0
                page.keyboard.down("Shift")
                page.mouse.click(e1["x"] + e1["w"]//2, e1["y"] + e1["h"]//2)
                page.keyboard.up("Shift")
                page.wait_for_timeout(600)
                shoot(page, "0303b-canvas-multiselect-real.png")
                add_manifest("0303b-canvas-multiselect-real.png", "Canvas", "Canvas multiselect — real template elements", "Shift+click 2 canvas elements after template apply")

                page.keyboard.press("Escape")

                # Inspector with element selected
                shoot(page, "0401c-inspector-with-element.png")
                add_manifest("0401c-inspector-with-element.png", "Inspector", "Inspector with element selected — rich state", "Element selected from template canvas")
            else:
                page.mouse.click(720, 500)
                page.wait_for_timeout(500)
                shoot(page, "0300b-canvas-empty-state-detail.png")
                add_manifest("0300b-canvas-empty-state-detail.png", "Canvas", "Canvas empty state — detail", "Canvas with no elements — start blank or browse templates CTAs")
        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.up("Shift")

        # ── 5. Layers panel after template (rich tree) ──
        print("\n[5] Layers after template")
        try:
            dismiss_all(page)
            click_rail(page, "layers")
            page.wait_for_timeout(800)

            panel = page.evaluate("""() => {
                const el = document.querySelector('.layout-shell__drawer');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                const items = Array.from(el.querySelectorAll('[class*="layer"], [class*="Layer"]'));
                return {x: r.x, y: r.y, w: r.width, h: r.height, itemCount: items.length};
            }""")
            print(f"  Layers panel: {panel}")

            if panel:
                shoot(page, "0720b-leftpanel-layers-rich.png", clip={
                    "x": panel["x"], "y": panel["y"],
                    "width": panel["w"], "height": panel["h"]
                })
                add_manifest("0720b-leftpanel-layers-rich.png", "Layers", f"Layers panel — {panel.get('itemCount', 0)} layer items", "Layers panel after template applied showing page structure")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 6. Full editor with all panels ──
        print("\n[6] Full editor — pages + canvas + inspector")
        try:
            dismiss_all(page)
            click_rail(page, "pages")
            page.wait_for_timeout(600)
            page.mouse.click(720, 600)
            page.wait_for_timeout(400)
            shoot(page, "0099c-editor-full-template.png")
            add_manifest("0099c-editor-full-template.png", "Editor", "Editor full state — Pages tab, template applied", "Full editor view after template was applied")
        except Exception as e:
            print(f"  ⚠ {e}")

        browser.close()

    # Regenerate manifest + README
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
        s = item.get("section", "Other")
        sections.setdefault(s, []).append(item)

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
    print(f"TARGETED PASS COMPLETE! {len(final)} screenshots")
    print(f"{'='*60}")
    pngs = gl.glob(str(OUTPUT_DIR / "*.png"))
    print(f"Total PNGs: {len(pngs)}")


if __name__ == "__main__":
    main()
