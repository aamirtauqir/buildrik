"""Cleanup pass — fix layers timeout, add elements via Insert menu, get remaining states."""

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
    page.wait_for_timeout(3000)  # Wait for React to hydrate
    try:
        page.click("text=Open", timeout=5000)
        page.wait_for_timeout(3000)
    except Exception:
        pass


def dismiss_all(page: Page) -> None:
    """Press Escape twice to close any open menus/modals."""
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

        # ── 1. Layers panel (use JS click to avoid timeout) ──
        print("\n[1] Layers panel")
        try:
            dismiss_all(page)
            click_rail(page, "layers")
            page.wait_for_timeout(1000)
            shoot(page, "0126b-leftpanel-layers-open.png")
            add_manifest("0126b-leftpanel-layers-open.png", "Layers", "Layers panel open", "Click Layers rail button")

            # Check what's in the layers tree
            layers_info = page.evaluate("""() => {
                const panel = document.querySelector('[id="rail-panel-layers"], .layers-panel, [class*="layers"]');
                if (!panel) return {found: false};
                const items = Array.from(panel.querySelectorAll('[class*="layer-item"], [class*="LayerItem"], [class*="layer-row"]'));
                return {
                    found: true,
                    cls: panel.className.toString().slice(0, 60),
                    itemCount: items.length,
                    items: items.slice(0, 5).map(el => ({
                        cls: el.className.toString().slice(0, 50),
                        text: el.textContent.trim().slice(0, 30)
                    }))
                };
            }""")
            print(f"  Layers info: {layers_info}")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 2. Try adding elements via canvas right-click Insert submenu ──
        print("\n[2] Canvas Insert submenu")
        try:
            dismiss_all(page)
            # Click on canvas background to deselect
            page.mouse.click(720, 600)
            page.wait_for_timeout(400)

            # Right-click canvas
            page.mouse.click(720, 500, button="right")
            page.wait_for_timeout(700)

            # Dump all context menu items
            menu_info = page.evaluate("""() => {
                const menus = Array.from(document.querySelectorAll('[class*="context-menu"], [class*="ContextMenu"], [role="menu"]'));
                return menus.map(m => ({
                    cls: m.className.toString().slice(0, 60),
                    items: Array.from(m.querySelectorAll('li, [role="menuitem"], button')).map(el => ({
                        text: el.textContent.trim().slice(0, 30),
                        x: Math.round(el.getBoundingClientRect().x),
                        y: Math.round(el.getBoundingClientRect().y)
                    }))
                }));
            }""")
            print(f"  Context menu: {menu_info}")

            if menu_info:
                shoot(page, "0304b-canvas-context-menu-empty.png")
                add_manifest("0304b-canvas-context-menu-empty.png", "Canvas", "Canvas context menu — empty area", "Right-click empty canvas area")

                # Find "Insert" item
                all_items = []
                for menu in menu_info:
                    all_items.extend(menu.get("items", []))

                insert_item = next((item for item in all_items if "insert" in item.get("text", "").lower()), None)
                print(f"  Insert item: {insert_item}")

                if insert_item:
                    page.mouse.click(insert_item["x"] + 5, insert_item["y"] + 5)
                    page.wait_for_timeout(500)

                    submenu_info = page.evaluate("""() => {
                        const menus = Array.from(document.querySelectorAll('[class*="context-menu"], [role="menu"]'));
                        return menus.map(m => ({
                            items: Array.from(m.querySelectorAll('li, [role="menuitem"], button')).map(el => ({
                                text: el.textContent.trim().slice(0, 30),
                                x: Math.round(el.getBoundingClientRect().x),
                                y: Math.round(el.getBoundingClientRect().y)
                            }))
                        }));
                    }""")
                    print(f"  Submenu: {submenu_info}")

                    # Try to click a text/heading item
                    all_sub_items = []
                    for m in submenu_info:
                        all_sub_items.extend(m.get("items", []))

                    text_item = next((item for item in all_sub_items if any(kw in item.get("text", "").lower() for kw in ["text", "heading", "paragraph", "button"])), None)
                    print(f"  Text item: {text_item}")

                    if text_item:
                        page.mouse.click(text_item["x"] + 5, text_item["y"] + 5)
                        page.wait_for_timeout(800)

                        # Check canvas elements
                        els = page.evaluate("""() => {
                            return Array.from(document.querySelectorAll('[data-aqb-type]')).map(el => {
                                const r = el.getBoundingClientRect();
                                return {x: r.x, y: r.y, w: r.width, h: r.height, type: el.getAttribute('data-aqb-type')};
                            }).filter(r => r.w > 5 && r.h > 5);
                        }""")
                        print(f"  Elements after insert: {len(els)} → {els}")
                    else:
                        dismiss_all(page)
                else:
                    dismiss_all(page)
            else:
                dismiss_all(page)
        except Exception as e:
            print(f"  ⚠ {e}")
            dismiss_all(page)

        # ── 3. Try Build panel double-click to add elements ──
        print("\n[3] Build panel — add elements")
        try:
            dismiss_all(page)
            click_rail(page, "add")
            page.wait_for_timeout(700)

            # Recon the build panel
            build_info = page.evaluate("""() => {
                const cards = Array.from(document.querySelectorAll('.bld-el-card, [class*="build-card"], [class*="BuildCard"]'));
                return cards.map(c => ({
                    text: c.textContent.trim().slice(0, 20),
                    cls: c.className.toString().slice(0, 40),
                    x: Math.round(c.getBoundingClientRect().x),
                    y: Math.round(c.getBoundingClientRect().y),
                    w: Math.round(c.getBoundingClientRect().width),
                    h: Math.round(c.getBoundingClientRect().height)
                }));
            }""")
            print(f"  Build cards: {build_info}")

            if build_info:
                # Try double-click on first card
                c = build_info[0]
                page.mouse.dblclick(c["x"] + c["w"]//2, c["y"] + c["h"]//2)
                page.wait_for_timeout(800)

                els = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('[data-aqb-type]')).filter(el => {
                        const r = el.getBoundingClientRect();
                        return r.width > 5 && r.height > 5;
                    }).length;
                }""")
                print(f"  Elements after dblclick: {els}")

                if els <= 1:
                    # Try drag-and-drop from build panel to canvas
                    cx = c["x"] + c["w"]//2
                    cy = c["y"] + c["h"]//2
                    page.mouse.move(cx, cy)
                    page.mouse.down()
                    page.wait_for_timeout(300)
                    page.mouse.move(720, 500, steps=15)
                    page.wait_for_timeout(400)
                    page.mouse.up()
                    page.wait_for_timeout(800)

                    els2 = page.evaluate("""() => {
                        return Array.from(document.querySelectorAll('[data-aqb-type]')).filter(el => {
                            const r = el.getBoundingClientRect();
                            return r.width > 5 && r.height > 5;
                        }).length;
                    }""")
                    print(f"  Elements after drag: {els2}")
        except Exception as e:
            print(f"  ⚠ {e}")
            dismiss_all(page)

        # ── 4. Check canvas elements and attempt multiselect ──
        print("\n[4] Canvas multiselect attempt")
        try:
            dismiss_all(page)
            page.mouse.click(720, 600)
            page.wait_for_timeout(400)

            els = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('[data-aqb-type]')).map(el => {
                    const r = el.getBoundingClientRect();
                    return {x: r.x, y: r.y, w: r.width, h: r.height, type: el.getAttribute('data-aqb-type')};
                }).filter(r => r.w > 5 && r.h > 5);
            }""")
            print(f"  Canvas elements: {len(els)}")

            if len(els) >= 2:
                e0, e1 = els[0], els[1]
                page.mouse.click(e0["x"] + e0["w"]//2, e0["y"] + e0["h"]//2)
                page.wait_for_timeout(300)
                page.keyboard.down("Shift")
                page.mouse.click(e1["x"] + e1["w"]//2, e1["y"] + e1["h"]//2)
                page.keyboard.up("Shift")
                page.wait_for_timeout(600)
                shoot(page, "0303b-canvas-multiselect-real.png")
                add_manifest("0303b-canvas-multiselect-real.png", "Canvas", "Canvas multiselect — real elements", "Shift+click 2 canvas elements")
                page.keyboard.press("Escape")
        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.up("Shift")

        # ── 5. Template Replace modal — try via "Use this template" nudge ──
        print("\n[5] Template nudge / replace modal")
        try:
            dismiss_all(page)
            click_rail(page, "templates")
            page.wait_for_timeout(800)

            # Recon template section
            tpl_info = page.evaluate("""() => {
                const nudge = document.querySelector('.tpl-nudge, .tpl-nudge-btn, [class*="nudge"]');
                const cards = Array.from(document.querySelectorAll('.tcard'));
                return {
                    hasNudge: !!nudge,
                    nudgeCls: nudge ? nudge.className.toString() : '',
                    nudgeText: nudge ? nudge.textContent.trim().slice(0, 30) : '',
                    nudgeRect: nudge ? {
                        x: Math.round(nudge.getBoundingClientRect().x),
                        y: Math.round(nudge.getBoundingClientRect().y),
                        w: Math.round(nudge.getBoundingClientRect().width),
                        h: Math.round(nudge.getBoundingClientRect().height)
                    } : null,
                    cardCount: cards.length
                };
            }""")
            print(f"  Template info: {tpl_info}")

            if not tpl_info.get("hasNudge"):
                # Click first card to select it
                cards = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('.tcard')).slice(0, 3).map(c => {
                        const r = c.getBoundingClientRect();
                        return {x: r.x, y: r.y, w: r.width, h: r.height};
                    });
                }""")
                if cards:
                    c = cards[0]
                    # Click center of card (avoid preview button area)
                    page.mouse.click(c["x"] + c["w"]//2, c["y"] + c["h"]//2)
                    page.wait_for_timeout(600)

                    # Check for nudge again
                    tpl_info2 = page.evaluate("""() => {
                        const nudge = document.querySelector('.tpl-nudge, .tpl-nudge-btn, [class*="nudge"]');
                        const allBtns = Array.from(document.querySelectorAll('.tpl-shell button')).map(b => ({
                            text: b.textContent.trim().slice(0, 30),
                            cls: b.className.toString().slice(0, 50),
                            x: Math.round(b.getBoundingClientRect().x),
                            y: Math.round(b.getBoundingClientRect().y),
                            disabled: b.disabled
                        }));
                        return {
                            hasNudge: !!nudge,
                            nudgeCls: nudge ? nudge.className.toString() : '',
                            allBtns: allBtns.slice(0, 10)
                        };
                    }""")
                    print(f"  After card click: {tpl_info2}")

                    # Try clicking any "Use" or apply button
                    for btn in tpl_info2.get("allBtns", []):
                        text = btn.get("text", "").lower()
                        if any(kw in text for kw in ["use", "apply", "this"]) and not btn.get("disabled"):
                            page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                            page.wait_for_timeout(1000)

                            # Check for replace modal
                            modal = page.evaluate("""() => {
                                const selectors = [
                                    '.tmpl-replace-modal',
                                    '[class*="replace-modal"]',
                                    '[class*="ReplaceModal"]',
                                    '[role="dialog"]'
                                ];
                                for (const sel of selectors) {
                                    const el = document.querySelector(sel);
                                    if (el && el.getBoundingClientRect().width > 50) {
                                        return {found: true, cls: el.className.toString().slice(0, 60)};
                                    }
                                }
                                return {found: false};
                            }""")
                            print(f"  Modal after btn click: {modal}")

                            if modal.get("found"):
                                shoot(page, "0137-templates-replace-modal.png")
                                add_manifest("0137-templates-replace-modal.png", "Templates", "Template Replace confirmation modal", "Select template → click 'Use This →' → Replace modal appears")
                                page.keyboard.press("Escape")
                            else:
                                shoot(page, "0137-templates-replace-modal.png")
                                add_manifest("0137-templates-replace-modal.png", "Templates", "Template selected state — use button pressed", f"Click '{btn['text']}' button")
                            break
        except Exception as e:
            print(f"  ⚠ {e}")
            dismiss_all(page)

        # ── 6. Project settings modal ──
        print("\n[6] Project settings from gear/menu")
        try:
            dismiss_all(page)

            # Look for settings gear or cog in topbar
            settings_btns = page.evaluate("""() => {
                const topbar = document.querySelector('.layout-shell__topbar, [class*="topbar"], [class*="Topbar"]');
                if (!topbar) return [];
                return Array.from(topbar.querySelectorAll('button, [role="button"]')).map(b => ({
                    text: b.textContent.trim().slice(0, 20),
                    cls: b.className.toString().slice(0, 50),
                    aria: b.getAttribute('aria-label') || '',
                    x: Math.round(b.getBoundingClientRect().x),
                    y: Math.round(b.getBoundingClientRect().y)
                }));
            }""")
            print(f"  Topbar buttons: {settings_btns}")

            # Try project name / dropdown (leftmost topbar item)
            proj_btn = next((b for b in settings_btns if "project" in b.get("cls", "").lower() or "proj" in b.get("cls", "").lower()), None)
            if not proj_btn:
                proj_btn = settings_btns[0] if settings_btns else None
            print(f"  Project btn: {proj_btn}")

            if proj_btn:
                page.mouse.click(proj_btn["x"] + 5, proj_btn["y"] + 5)
                page.wait_for_timeout(600)

                # Look for dropdown items
                dropdown = page.evaluate("""() => {
                    const items = Array.from(document.querySelectorAll('[class*="dropdown"], [class*="Dropdown"], [role="menu"]'));
                    return items.map(m => ({
                        cls: m.className.toString().slice(0, 60),
                        items: Array.from(m.querySelectorAll('button, [role="menuitem"], li')).map(el => ({
                            text: el.textContent.trim().slice(0, 30),
                            x: Math.round(el.getBoundingClientRect().x),
                            y: Math.round(el.getBoundingClientRect().y)
                        }))
                    }));
                }""")
                print(f"  Dropdown: {dropdown}")

                # Look for settings/properties item
                for menu in dropdown:
                    for item in menu.get("items", []):
                        text = item.get("text", "").lower()
                        if any(kw in text for kw in ["setting", "propert", "rename", "duplicat"]):
                            page.mouse.click(item["x"] + 5, item["y"] + 5)
                            page.wait_for_timeout(800)

                            modal = page.evaluate("""() => {
                                const modals = document.querySelectorAll('[role="dialog"]');
                                for (const m of modals) {
                                    if (m.getBoundingClientRect().width > 100) {
                                        return {found: true, cls: m.className.toString().slice(0, 60)};
                                    }
                                }
                                return {found: false};
                            }""")
                            print(f"  Modal: {modal}")

                            if modal.get("found"):
                                shoot(page, "0501-modal-project-settings.png")
                                add_manifest("0501-modal-project-settings.png", "Modals", "Project settings modal", f"Project menu → {item['text']}")
                                page.keyboard.press("Escape")
                            break

                dismiss_all(page)
        except Exception as e:
            print(f"  ⚠ {e}")
            dismiss_all(page)

        # ── 7. Layers panel with deep exploration ──
        print("\n[7] Layers panel deep")
        try:
            dismiss_all(page)
            click_rail(page, "layers")
            page.wait_for_timeout(1000)

            # Get full layers panel structure
            panel_info = page.evaluate("""() => {
                const drawer = document.querySelector('.layout-shell__drawer');
                if (!drawer) return {found: false};
                const r = drawer.getBoundingClientRect();
                return {
                    found: true,
                    x: r.x, y: r.y, w: r.width, h: r.height,
                    innerHTML: drawer.innerHTML.slice(0, 500)
                };
            }""")
            print(f"  Drawer: x={panel_info.get('x')}, w={panel_info.get('w')}, h={panel_info.get('h')}")

            if panel_info.get("found"):
                shoot(page, "0126c-leftpanel-layers-full.png", clip={
                    "x": panel_info["x"],
                    "y": panel_info["y"],
                    "width": panel_info["w"],
                    "height": panel_info["h"]
                })
                add_manifest("0126c-leftpanel-layers-full.png", "Layers", "Layers panel full — close-up", "Layers panel content showing page structure")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 8. History panel with entries ──
        print("\n[8] History panel")
        try:
            dismiss_all(page)
            click_rail(page, "history")
            page.wait_for_timeout(1000)

            drawer = page.evaluate("""() => {
                const el = document.querySelector('.layout-shell__drawer');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            if drawer:
                shoot(page, "0127b-leftpanel-history-full.png", clip={
                    "x": drawer["x"], "y": drawer["y"],
                    "width": drawer["w"], "height": drawer["h"]
                })
                add_manifest("0127b-leftpanel-history-full.png", "History", "History panel full — close-up", "History panel content showing undo stack")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 9. Publish tab detail ──
        print("\n[9] Publish tab close-up")
        try:
            dismiss_all(page)
            click_rail(page, "publish")
            page.wait_for_timeout(800)

            drawer = page.evaluate("""() => {
                const el = document.querySelector('.layout-shell__drawer');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            if drawer:
                shoot(page, "0180b-publish-tab-full.png", clip={
                    "x": drawer["x"], "y": drawer["y"],
                    "width": drawer["w"], "height": drawer["h"]
                })
                add_manifest("0180b-publish-tab-full.png", "Publish", "Publish tab full — close-up", "Publish panel close-up")
        except Exception as e:
            print(f"  ⚠ Publish: {e}")

        # ── 10. Final full editor screenshot ──
        print("\n[10] Final editor overview")
        try:
            dismiss_all(page)
            click_rail(page, "pages")
            page.wait_for_timeout(600)
            page.mouse.click(720, 600)
            page.wait_for_timeout(400)
            shoot(page, "0099b-editor-overview-final.png")
            add_manifest("0099b-editor-overview-final.png", "Editor", "Editor final overview — Pages tab open", "Final state with Pages tab, canvas visible")
        except Exception as e:
            print(f"  ⚠ {e}")

        browser.close()

    # Regenerate manifest + README
    import time
    import glob as gl

    data = json.loads(manifest_path.read_text())
    all_pngs = sorted((OUTPUT_DIR).glob("*.png"), key=lambda p: p.name)
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
            fn = item["file"]
            state = item["state"]
            how = item["how_to_reproduce"]
            lines.append(f"| [`{fn}`]({fn}) | {state} | {how} |")
        lines.append("")

    readme_path = OUTPUT_DIR / "README.md"
    readme_path.write_text("\n".join(lines))

    print(f"\n{'='*60}")
    print(f"CLEANUP COMPLETE! {len(final)} screenshots")
    print(f"{'='*60}")
    pngs = gl.glob(str(OUTPUT_DIR / "*.png"))
    print(f"Total PNGs: {len(pngs)}")


if __name__ == "__main__":
    main()
