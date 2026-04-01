"""
Final modal capture pass — correct selectors:
  Replace modal → .tpl-modal-overlay / .tpl-modal
  Progress overlay → .tmpl-progress
"""

import json, time
from pathlib import Path
from playwright.sync_api import sync_playwright, Page

BASE_URL = "http://localhost:5173"
OUTPUT_DIR = Path(__file__).parent / "latest-screenshots"
VIEWPORT = {"width": 1440, "height": 900}
manifest_path = OUTPUT_DIR / "manifest.json"


def shoot(page, fn, clip=None):
    kwargs = {"path": str(OUTPUT_DIR / fn), "timeout": 6000}
    if clip:
        kwargs["clip"] = clip
    page.screenshot(**kwargs)
    print(f"  ✓ {fn}")


def add_manifest(fn, section, state, how):
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


def click_rail(page, tab_id):
    page.click(f'[id="rail-tab-{tab_id}"]', timeout=8000)
    page.wait_for_timeout(600)


def enter_editor(page):
    page.goto(BASE_URL, wait_until="commit", timeout=30000)
    page.wait_for_timeout(2000)
    try:
        page.click("text=Open", timeout=5000)
        page.wait_for_timeout(2000)
    except Exception:
        pass
    page.wait_for_selector('[id="rail-tab-templates"]', timeout=12000)
    page.wait_for_timeout(500)


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, slow_mo=0)
        ctx = browser.new_context(viewport=VIEWPORT, reduced_motion="reduce", color_scheme="dark")
        page = ctx.new_page()

        print("--- Entering editor ---")
        enter_editor(page)

        # ── Go to templates ──
        click_rail(page, "templates")

        # Get free card info
        cards = page.evaluate("""() =>
            Array.from(document.querySelectorAll('.tcard:not(.tcard--locked)')).map(c => ({
                aria: c.getAttribute('aria-label') || '',
                x: Math.round(c.getBoundingClientRect().x),
                y: Math.round(c.getBoundingClientRect().y),
                w: Math.round(c.getBoundingClientRect().width),
                h: Math.round(c.getBoundingClientRect().height)
            }))
        """)
        print(f"  Free cards: {[c['aria'] for c in cards]}")

        # ── 1. Click first card, then "Use This →" ──
        print("\n[1] Click card + Use This →")
        c0 = cards[0]
        page.mouse.click(c0["x"] + c0["w"]//2, c0["y"] + c0["h"] - 15)
        page.wait_for_timeout(400)

        nudge = page.evaluate("""() => {
            const b = document.querySelector('.tpl-nudge-btn');
            return b ? {text: b.textContent.trim(), disabled: b.disabled,
                x: b.getBoundingClientRect().x, y: b.getBoundingClientRect().y,
                w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height} : null;
        }""")
        print(f"  Nudge: {nudge}")

        if nudge and not nudge["disabled"]:
            page.mouse.click(nudge["x"] + nudge["w"]//2, nudge["y"] + nudge["h"]//2)

            # Rapid poll for Replace modal (.tpl-modal-overlay) OR progress overlay (.tmpl-progress)
            replace_found = False
            progress_found = False

            for i in range(40):  # 4 seconds @ 100ms
                time.sleep(0.1)
                state = page.evaluate("""() => {
                    const replace = document.querySelector('.tpl-modal-overlay');
                    const progress = document.querySelector('.tmpl-progress');
                    return {
                        hasReplace: !!(replace && replace.getBoundingClientRect().width > 50),
                        hasProgress: !!(progress && progress.getBoundingClientRect().width > 50),
                        replaceCls: replace ? replace.className.toString() : '',
                        progressCls: progress ? progress.className.toString() : ''
                    };
                }""")

                if state["hasReplace"] and not replace_found:
                    print(f"  ✓ Replace modal at {i*100}ms")
                    shoot(page, "0137-templates-replace-modal.png")
                    add_manifest("0137-templates-replace-modal.png", "Templates",
                                 "Template Replace confirmation modal",
                                 "Canvas has content → 'Use This →' → Replace modal (.tpl-modal-overlay)")
                    replace_found = True

                    # Get "Replace" button to confirm
                    btns = page.evaluate("""() =>
                        Array.from(document.querySelectorAll('.tpl-modal-btn')).map(b => ({
                            text: b.textContent.trim().slice(0, 20),
                            cls: b.className.toString(),
                            x: Math.round(b.getBoundingClientRect().x),
                            y: Math.round(b.getBoundingClientRect().y),
                            w: Math.round(b.getBoundingClientRect().width)
                        }))
                    """)
                    print(f"  Modal buttons: {btns}")

                    # Click the primary button (Replace/Apply)
                    primary = next((b for b in btns if "primary" in b.get("cls", "")), None)
                    if primary:
                        page.mouse.click(primary["x"] + primary["w"]//2, primary["y"] + 5)
                        print("  Clicked primary button")

                if state["hasProgress"] and not progress_found:
                    print(f"  ✓ Progress overlay at {i*100}ms")
                    shoot(page, "0139-templates-apply-progress.png")
                    add_manifest("0139-templates-apply-progress.png", "Templates",
                                 "Template apply progress overlay (ApplyProgressOverlay)",
                                 "After Replace confirmed (or direct apply) → progress animation shows")
                    progress_found = True

                if replace_found and progress_found:
                    break

            print(f"  Replace found: {replace_found}, Progress found: {progress_found}")

            # Wait for apply to complete
            time.sleep(3)
        else:
            print("  Nudge not found or disabled")

        # Check canvas state
        canvas_count = page.evaluate("""() =>
            Array.from(document.querySelectorAll('[data-aqb-type]')).filter(el => {
                const r = el.getBoundingClientRect();
                return r.width > 5 && r.height > 5;
            }).length
        """)
        print(f"\n  Canvas after apply: {canvas_count} elements")

        if canvas_count >= 2:
            # Multiselect
            print("\n[2] Canvas multiselect")
            els = page.evaluate("""() =>
                Array.from(document.querySelectorAll('[data-aqb-type]')).map(el => {
                    const r = el.getBoundingClientRect();
                    return {x: r.x, y: r.y, w: r.width, h: r.height};
                }).filter(r => r.w > 5 && r.h > 5)
            """)
            page.mouse.click(els[0]["x"] + els[0]["w"]//2, els[0]["y"] + els[0]["h"]//2)
            page.wait_for_timeout(300)
            page.keyboard.down("Shift")
            page.mouse.click(els[1]["x"] + els[1]["w"]//2, els[1]["y"] + els[1]["h"]//2)
            page.keyboard.up("Shift")
            page.wait_for_timeout(500)
            shoot(page, "0303c-canvas-multiselect-confirmed.png")
            add_manifest("0303c-canvas-multiselect-confirmed.png", "Canvas",
                         "Canvas multiselect — template elements", "Shift+click 2 template elements")
            page.keyboard.press("Escape")

        # ── Full editor screenshot ──
        print("\n[3] Full editor after template")
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
        shoot(page, "0099f-editor-template-complete.png")
        add_manifest("0099f-editor-template-complete.png", "Editor",
                     "Editor with template applied — complete state", "Final editor state")

        browser.close()

    # Update manifest
    data = json.loads(manifest_path.read_text())
    all_pngs = sorted(OUTPUT_DIR.glob("*.png"), key=lambda p: p.name)
    existing = {item["file"]: item for item in data}
    final = [existing.get(png.name, {
        "file": png.name, "section": "Unknown",
        "state": png.name.replace(".png", "").replace("-", " "),
        "how_to_reproduce": f"Screenshot of: {png.name}"
    }) for png in all_pngs]
    manifest_path.write_text(json.dumps(final, indent=2))

    # Regenerate README
    import time as tmod, glob as gl
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
    ordered.update(sections)
    lines = [
        "# Aquibra Editor — Complete Screenshot Library", "",
        f"> **Total screenshots:** {len(final)}  ",
        f"> **Generated:** {tmod.strftime('%Y-%m-%d %H:%M')}  ",
        f"> **Viewport:** 1440×900 · Chromium headless · Dark mode", "",
        "---", "", "## Quick Index", "",
    ]
    for section, items in ordered.items():
        anchor = section.lower().replace(" ", "-").replace("/", "")
        lines.append(f"- [{section} ({len(items)})](#{anchor})")
    lines += ["", "---", ""]
    for section, items in ordered.items():
        lines += [f"## {section}", "", "| File | State | How to Reproduce |", "|------|-------|-----------------|"]
        for item in items:
            lines.append(f"| [`{item['file']}`]({item['file']}) | {item['state']} | {item['how_to_reproduce']} |")
        lines.append("")
    readme_path = OUTPUT_DIR / "README.md"
    readme_path.write_text("\n".join(lines))

    pngs = gl.glob(str(OUTPUT_DIR / "*.png"))
    print(f"\n{'='*60}")
    print(f"MODALS PASS COMPLETE! {len(final)} entries, {len(pngs)} PNGs")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
