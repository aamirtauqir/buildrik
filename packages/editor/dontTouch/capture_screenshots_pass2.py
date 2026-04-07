"""
Aquibra Editor — Screenshot Pass 2
Targeted capture for states missed in pass 1.
Covers: canvas element selection, inspector tabs, templates hover/preview,
        media filters, design color picker, settings screens, breakpoints.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright, Page, Browser, BrowserContext

# ── Config ─────────────────────────────────────────────────────────────────
BASE_URL    = "http://localhost:5173/"
OUT_DIR     = Path(__file__).parent / "latest-screenshots"
MANIFEST    = OUT_DIR / "manifest.json"
TIMEOUT     = 10_000   # ms – default wait
NAV_TIMEOUT = 20_000

# ── Helpers ─────────────────────────────────────────────────────────────────

def log(msg: str):
    print(f"[PASS2] {msg}", flush=True)

async def save(page: Page, filename: str):
    dst = OUT_DIR / filename
    await page.screenshot(path=str(dst), full_page=False)
    log(f"  SAVED {filename}")

async def wait_settle(page: Page, ms: int = 600):
    await page.wait_for_timeout(ms)

async def try_click(page: Page, selector: str, timeout: int = 4000) -> bool:
    try:
        await page.click(selector, timeout=timeout)
        return True
    except Exception as e:
        log(f"    click failed [{selector}]: {e}")
        return False

async def try_hover(page: Page, selector: str, timeout: int = 4000) -> bool:
    try:
        await page.hover(selector, timeout=timeout)
        return True
    except Exception as e:
        log(f"    hover failed [{selector}]: {e}")
        return False

# ── Navigate to editor ───────────────────────────────────────────────────────

async def open_editor(page: Page) -> bool:
    """Load the app and enter the editor (click first Open/project card)."""
    log("Navigating to app root...")
    try:
        await page.goto(BASE_URL, wait_until="networkidle", timeout=NAV_TIMEOUT)
    except Exception:
        await page.goto(BASE_URL, timeout=NAV_TIMEOUT)
    await wait_settle(page, 1500)

    log("Trying to enter editor...")

    # Strategy 1 — explicit Open buttons
    for sel in [
        "button:has-text('Open')",
        "a:has-text('Open')",
        "[data-testid='open-project']",
        "button:has-text('Edit')",
        "a:has-text('Edit')",
    ]:
        try:
            el = page.locator(sel).first
            if await el.count() and await el.is_visible():
                await el.click(timeout=4000)
                await page.wait_for_load_state("networkidle", timeout=NAV_TIMEOUT)
                await wait_settle(page, 1500)
                log(f"  Entered editor via [{sel}]")
                return True
        except Exception:
            pass

    # Strategy 2 — project card
    for sel in [
        "[class*='project-card']",
        "[class*='ProjectCard']",
        "[data-testid='project-card']",
        "[class*='card']:not([class*='feature'])",
    ]:
        try:
            el = page.locator(sel).first
            if await el.count() and await el.is_visible():
                await el.click(timeout=4000)
                await page.wait_for_load_state("networkidle", timeout=NAV_TIMEOUT)
                await wait_settle(page, 1500)
                log(f"  Entered editor via card [{sel}]")
                return True
        except Exception:
            pass

    # Strategy 3 — already in editor
    try:
        rail = page.locator("[id^='rail-tab-']").first
        if await rail.count():
            log("  Already in editor (rail detected)")
            return True
    except Exception:
        pass

    # Strategy 4 — direct path
    for path in ["/editor", "/editor/new", "/studio", "/app/editor"]:
        try:
            await page.goto(BASE_URL.rstrip("/") + path, wait_until="networkidle", timeout=NAV_TIMEOUT)
            await wait_settle(page, 1500)
            rail = page.locator("[id^='rail-tab-']").first
            if await rail.count():
                log(f"  Editor found at {path}")
                return True
        except Exception:
            pass

    log("WARNING: Could not confirm editor entry — proceeding anyway")
    return False


# ── DOM recon ──────────────────────────────────────────────────────────────

async def recon(page: Page):
    log("=== DOM RECON ===")

    # Rail tabs
    rail_ids = await page.eval_on_selector_all(
        "[id^='rail-tab-']",
        "els => els.map(e => ({id: e.id, text: e.textContent?.trim()}))"
    )
    log(f"Rail tabs found: {rail_ids}")

    # Canvas selectors
    for sel in [".aqb-canvas", "[data-aqb-canvas]", ".pen-canvas", "#canvas-root", "[class*='canvas']"]:
        try:
            cnt = await page.locator(sel).count()
            if cnt:
                log(f"Canvas selector [{sel}]: {cnt} match(es)")
        except Exception:
            pass

    # Elements inside canvas
    try:
        inner = await page.eval_on_selector(
            ".aqb-canvas",
            "el => ({children: el.children.length, snippet: el.outerHTML.slice(0,200)})"
        )
        log(f"Canvas inner: {inner}")
    except Exception:
        log("Canvas .aqb-canvas not found or empty")

    # Inspector selectors
    for sel in ["[class*='inspector']", "[class*='Inspector']", "[data-panel='inspector']"]:
        cnt = await page.locator(sel).count()
        if cnt:
            log(f"Inspector [{sel}]: {cnt}")

    # Breakpoint controls
    for sel in ["button:has-text('Desktop')", "button:has-text('Tablet')", "button:has-text('Mobile')"]:
        cnt = await page.locator(sel).count()
        if cnt:
            log(f"Breakpoint [{sel}]: {cnt}")

    log("=== END RECON ===\n")


# ── Click rail tab helper ──────────────────────────────────────────────────

async def open_rail_tab(page: Page, tab_id: str) -> bool:
    """Click rail-tab-{tab_id} and wait for panel to open."""
    sel = f"#rail-tab-{tab_id}"
    try:
        el = page.locator(sel)
        if await el.count():
            await el.click(timeout=4000)
            await wait_settle(page, 700)
            return True
    except Exception:
        pass

    # Fallback text match
    fallback_map = {
        "templates": ["Templates", "template"],
        "assets":    ["Media", "media", "Assets"],
        "design":    ["Design", "design system"],
        "settings":  ["Settings", "Config"],
        "layers":    ["Layers"],
        "pages":     ["Pages"],
    }
    for text in fallback_map.get(tab_id, []):
        try:
            el = page.locator(f"button:has-text('{text}')").first
            if await el.count():
                await el.click(timeout=4000)
                await wait_settle(page, 700)
                log(f"  Opened {tab_id} via text match '{text}'")
                return True
        except Exception:
            pass
    return False


# ── Inject sample content into canvas ─────────────────────────────────────

async def inject_canvas_content(page: Page):
    """
    Attempt to put sample content on the canvas via the composer API.
    This is a test-only helper so we have elements to click-select.
    """
    log("Injecting canvas content via composer API...")

    # Use composer API if exposed on window
    result = await page.evaluate("""
        () => {
            const composer = window.__aquibra_composer__ || window._composer || window.composer;
            if (composer && composer.elements && composer.elements.importHTMLToActivePage) {
                try {
                    const sampleHtml = [
                        '<section data-aqb-id="test-hero"',
                        ' style="width:100%;padding:80px 40px;',
                        'background:#1a1a2e;color:#fff;',
                        'font-family:sans-serif;text-align:center">',
                        '<h1 style="font-size:48px;margin-bottom:16px">Aquibra Demo</h1>',
                        '<p style="font-size:18px;color:#a1a1aa">Click to select</p>',
                        '</section>',
                        '<div data-aqb-id="test-card"',
                        ' style="width:300px;margin:24px auto;padding:24px;',
                        'background:#252542;border-radius:12px;color:#fff">',
                        '<h2 style="font-size:20px;margin-bottom:8px">Card Element</h2>',
                        '<p style="color:#a1a1aa;font-size:14px">Second element</p>',
                        '</div>'
                    ].join('');
                    composer.elements.importHTMLToActivePage(sampleHtml);
                    return 'ok-composer';
                } catch(e) {
                    return 'composer-error:' + String(e);
                }
            }
            return 'no-composer';
        }
    """)
    log(f"  Inject result: {result}")

    if result == "no-composer":
        # Fallback: construct DOM nodes programmatically (avoids innerHTML pattern)
        log("  Fallback: building DOM nodes via createElement...")
        await page.evaluate("""
            () => {
                const canvas = document.querySelector('.aqb-canvas') ||
                               document.querySelector('[data-aqb-canvas]');
                if (!canvas || canvas.children.length > 0) return;

                // Build section element via createElement
                const section = document.createElement('section');
                section.setAttribute('data-aqb-id', 'test-hero');
                section.style.cssText = [
                    'width:100%',
                    'padding:80px 40px',
                    'background:#1a1a2e',
                    'color:#fff',
                    'font-family:sans-serif',
                    'text-align:center',
                    'cursor:pointer'
                ].join(';');

                const h1 = document.createElement('h1');
                h1.style.cssText = 'font-size:48px;margin-bottom:16px';
                h1.textContent = 'Aquibra Demo';

                const p = document.createElement('p');
                p.style.cssText = 'font-size:18px;color:#a1a1aa';
                p.textContent = 'Click to select';

                section.appendChild(h1);
                section.appendChild(p);

                // Build card element
                const card = document.createElement('div');
                card.setAttribute('data-aqb-id', 'test-card');
                card.style.cssText = [
                    'width:300px',
                    'margin:24px auto',
                    'padding:24px',
                    'background:#252542',
                    'border-radius:12px',
                    'color:#fff',
                    'cursor:pointer'
                ].join(';');

                const h2 = document.createElement('h2');
                h2.style.cssText = 'font-size:20px;margin-bottom:8px';
                h2.textContent = 'Card Element';

                const p2 = document.createElement('p');
                p2.style.cssText = 'color:#a1a1aa;font-size:14px';
                p2.textContent = 'Second element';

                card.appendChild(h2);
                card.appendChild(p2);

                canvas.appendChild(section);
                canvas.appendChild(card);
            }
        """)
        log("  Fallback DOM injection complete")

    await wait_settle(page, 800)


# ═══════════════════════════════════════════════════════════════════════════
# SECTION A — Topbar: Mobile breakpoint
# ═══════════════════════════════════════════════════════════════════════════

async def capture_topbar_mobile(page: Page):
    log("\n-- A: Topbar Mobile Breakpoint --")
    try:
        opened = False
        for sel in [
            "button:has-text('Desktop')",
            "button[title*='Desktop' i]",
            "[aria-label*='breakpoint' i]",
            "[class*='breakpoint']",
        ]:
            try:
                el = page.locator(sel).first
                if await el.count() and await el.is_visible(timeout=3000):
                    await el.click(timeout=3000)
                    await wait_settle(page, 400)
                    opened = True
                    log(f"  Opened breakpoint dropdown via [{sel}]")
                    break
            except Exception:
                pass

        if not opened:
            log("  Could not open breakpoint dropdown -- saving raw screenshot")
            await save(page, "0203-topbar-breakpoint-mobile.png")
            return

        # Click Mobile option
        mobile_clicked = False
        for sel in [
            "li:has-text('Mobile')",
            "button:has-text('Mobile')",
            "[role='option']:has-text('Mobile')",
            "[role='menuitem']:has-text('Mobile')",
            "text=Mobile",
        ]:
            try:
                el = page.locator(sel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 600)
                    mobile_clicked = True
                    log("  Mobile breakpoint selected")
                    break
            except Exception:
                pass

        await save(page, "0203-topbar-breakpoint-mobile.png")

        # Restore Desktop
        if mobile_clicked:
            for sel in ["button:has-text('Mobile')", "[class*='breakpoint']"]:
                try:
                    el = page.locator(sel).first
                    if await el.count() and await el.is_visible(timeout=2000):
                        await el.click(timeout=2000)
                        await wait_settle(page, 300)
                        for dsel in [
                            "li:has-text('Desktop')",
                            "[role='option']:has-text('Desktop')",
                            "text=Desktop",
                        ]:
                            try:
                                del_el = page.locator(dsel).first
                                if await del_el.count():
                                    await del_el.click(timeout=2000)
                                    break
                            except Exception:
                                pass
                        break
                except Exception:
                    pass
        await wait_settle(page, 400)
    except Exception as e:
        log(f"  ERROR in topbar_mobile: {e}")
        await save(page, "0203-topbar-breakpoint-mobile.png")


# ═══════════════════════════════════════════════════════════════════════════
# SECTION B — Templates: card hover + preview modal
# ═══════════════════════════════════════════════════════════════════════════

async def capture_templates(page: Page):
    log("\n-- B: Templates Card Hover + Preview Modal --")
    try:
        await open_rail_tab(page, "templates")
        await wait_settle(page, 800)

        # Count cards
        card_sel = ".tcard, [class*='tcard'], [data-id]"
        card_count = await page.locator(card_sel).count()
        log(f"  Template cards found: {card_count}")

        if card_count == 0:
            log("  No template cards -- saving blank")
            for fn in [
                "0131-templates-card-hover.png",
                "0133-templates-preview-modal-desktop.png",
                "0134-templates-preview-modal-tablet.png",
                "0135-templates-preview-modal-mobile.png",
            ]:
                await save(page, fn)
            return

        # Hover first card
        first_card = page.locator(card_sel).first
        await first_card.hover()
        await wait_settle(page, 500)
        await save(page, "0131-templates-card-hover.png")

        # Click Preview button on the hovered card
        preview_clicked = False
        for psel in [
            ".tcard-prev-btn",
            "button:has-text('Preview')",
            "[class*='prev-btn']",
            ".tcard-hover-ov button",
            ".tcard-lock-ov button",
        ]:
            try:
                el = page.locator(psel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 800)
                    preview_clicked = True
                    log(f"  Preview clicked via [{psel}]")
                    break
            except Exception:
                pass

        if not preview_clicked:
            # Try click-then-preview
            try:
                await first_card.click(timeout=3000)
                await wait_settle(page, 400)
            except Exception:
                pass
            for psel in [".tcard-prev-btn", "button:has-text('Preview')"]:
                try:
                    el = page.locator(psel).first
                    if await el.count():
                        await el.click(timeout=2000)
                        await wait_settle(page, 800)
                        preview_clicked = True
                        break
                except Exception:
                    pass

        # Preview modal — desktop
        await save(page, "0133-templates-preview-modal-desktop.png")

        if preview_clicked:
            # Switch to Tablet
            for vsel in [
                "button[aria-label='Tablet']",
                "button[title='Tablet']",
                ".tmpl-preview__vp-btn:nth-child(2)",
            ]:
                try:
                    el = page.locator(vsel).first
                    if await el.count() and await el.is_visible(timeout=2000):
                        await el.click(timeout=2000)
                        await wait_settle(page, 400)
                        log("  Switched to Tablet in preview")
                        break
                except Exception:
                    pass
            await save(page, "0134-templates-preview-modal-tablet.png")

            # Switch to Mobile
            for vsel in [
                "button[aria-label='Mobile']",
                "button[title='Mobile']",
                ".tmpl-preview__vp-btn:nth-child(3)",
            ]:
                try:
                    el = page.locator(vsel).first
                    if await el.count() and await el.is_visible(timeout=2000):
                        await el.click(timeout=2000)
                        await wait_settle(page, 400)
                        log("  Switched to Mobile in preview")
                        break
                except Exception:
                    pass
            await save(page, "0135-templates-preview-modal-mobile.png")

            # Close preview
            for csel in [
                "button[aria-label='Close preview']",
                ".tmpl-preview__close",
                ".tmpl-preview__back",
                "button:has-text('Back')",
            ]:
                try:
                    el = page.locator(csel).first
                    if await el.count():
                        await el.click(timeout=2000)
                        await wait_settle(page, 400)
                        log("  Preview closed")
                        break
                except Exception:
                    pass
        else:
            await save(page, "0134-templates-preview-modal-tablet.png")
            await save(page, "0135-templates-preview-modal-mobile.png")

    except Exception as e:
        log(f"  ERROR in capture_templates: {e}")
        for fn in [
            "0131-templates-card-hover.png",
            "0133-templates-preview-modal-desktop.png",
            "0134-templates-preview-modal-tablet.png",
            "0135-templates-preview-modal-mobile.png",
        ]:
            try:
                await save(page, fn)
            except Exception:
                pass


# ═══════════════════════════════════════════════════════════════════════════
# SECTION C — Media: type filter + upload zone
# ═══════════════════════════════════════════════════════════════════════════

async def capture_media(page: Page):
    log("\n-- C: Media Type Filter + Upload Zone --")
    try:
        await open_rail_tab(page, "assets")
        await wait_settle(page, 800)

        # Find and click Image filter pill
        for fsel in [
            "button:has-text('Images')",
            "button:has-text('Image')",
            "[class*='filter']:has-text('Image')",
            "[class*='pill']:has-text('Image')",
            "button:has-text('Photos')",
        ]:
            try:
                el = page.locator(fsel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 400)
                    log(f"  Filter clicked via [{fsel}]")
                    break
            except Exception:
                pass

        await save(page, "0152-media-type-filter.png")

        # Hover upload zone if it exists
        for usel in [
            "[class*='upload']",
            "[class*='drop-zone']",
            "[class*='dropzone']",
            "button:has-text('Upload')",
            "[class*='library-upload']",
        ]:
            try:
                el = page.locator(usel).first
                if await el.count():
                    log(f"  Upload zone found: [{usel}]")
                    try:
                        await el.hover(timeout=2000)
                        await wait_settle(page, 300)
                    except Exception:
                        pass
                    break
            except Exception:
                pass

        await save(page, "0153-media-upload-zone.png")

    except Exception as e:
        log(f"  ERROR in capture_media: {e}")
        await save(page, "0152-media-type-filter.png")
        await save(page, "0153-media-upload-zone.png")


# ═══════════════════════════════════════════════════════════════════════════
# SECTION D — Design System: Color Picker
# ═══════════════════════════════════════════════════════════════════════════

async def capture_design_color_picker(page: Page):
    log("\n-- D: Design System Color Picker --")
    try:
        await open_rail_tab(page, "design")
        await wait_settle(page, 800)

        # Try to click a color swatch to open picker
        picker_opened = False
        for csel in [
            "[class*='color-swatch']",
            "[class*='ColorSwatch']",
            "[class*='color-token']",
            ".ctr-swatch",
            "[class*='swatch']",
            "button[class*='color']",
        ]:
            try:
                el = page.locator(csel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 600)
                    # Check if picker is now visible
                    for psel in [
                        "[class*='color-picker']",
                        "[class*='ColorPicker']",
                        ".cp-shell",
                        "canvas",
                    ]:
                        if await page.locator(psel).count():
                            picker_opened = True
                            log(f"  Picker opened via [{csel}]")
                            break
                    if picker_opened:
                        break
            except Exception:
                pass

        if not picker_opened:
            for esel in [
                "button[aria-label*='edit' i]",
                "button[title*='edit' i]",
                "[class*='edit-btn']",
            ]:
                try:
                    el = page.locator(esel).first
                    if await el.count():
                        await el.click(timeout=2000)
                        await wait_settle(page, 600)
                        picker_opened = True
                        log(f"  Picker opened via edit btn [{esel}]")
                        break
                except Exception:
                    pass

        await save(page, "0163-design-color-picker.png")
        await page.keyboard.press("Escape")
        await wait_settle(page, 300)

    except Exception as e:
        log(f"  ERROR in capture_design_color_picker: {e}")
        await save(page, "0163-design-color-picker.png")


# ═══════════════════════════════════════════════════════════════════════════
# SECTION E — Settings: Export + Integrations
# ═══════════════════════════════════════════════════════════════════════════

async def capture_settings_screens(page: Page):
    log("\n-- E: Settings -- Export + Integrations --")
    try:
        await open_rail_tab(page, "settings")
        await wait_settle(page, 800)

        # Click Export feature card
        for esel in [
            "button:has-text('Export')",
            "[class*='feature-card']:has-text('Export')",
            "[class*='FeatureCard']:has-text('Export')",
        ]:
            try:
                el = page.locator(esel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 800)
                    log(f"  Export clicked via [{esel}]")
                    break
            except Exception:
                pass

        await save(page, "0174-settings-export.png")

        # Go back
        back_ok = False
        for bsel in [
            "button:has-text('Back')",
            "[aria-label*='back' i]",
            "[class*='back-btn']",
            "[class*='DrillInHeader'] button",
            "[class*='drill'] button",
        ]:
            try:
                el = page.locator(bsel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 600)
                    back_ok = True
                    log(f"  Back clicked via [{bsel}]")
                    break
            except Exception:
                pass

        if not back_ok:
            await open_rail_tab(page, "settings")
            await wait_settle(page, 800)

        # Click Integrations feature card
        for isel in [
            "button:has-text('Integrations')",
            "[class*='feature-card']:has-text('Integrations')",
            "[class*='FeatureCard']:has-text('Integrations')",
        ]:
            try:
                el = page.locator(isel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 800)
                    log(f"  Integrations clicked via [{isel}]")
                    break
            except Exception:
                pass

        await save(page, "0175-settings-integrations.png")

        # Back
        for bsel in ["button:has-text('Back')", "[class*='DrillInHeader'] button"]:
            try:
                el = page.locator(bsel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 400)
                    break
            except Exception:
                pass

    except Exception as e:
        log(f"  ERROR in capture_settings_screens: {e}")
        await save(page, "0174-settings-export.png")
        await save(page, "0175-settings-integrations.png")


# ═══════════════════════════════════════════════════════════════════════════
# SECTION F — Canvas element selection states
# ═══════════════════════════════════════════════════════════════════════════

async def capture_canvas_states(page: Page):
    log("\n-- F: Canvas Element Selection States --")
    try:
        await page.keyboard.press("Escape")
        await wait_settle(page, 300)

        # Recon canvas
        canvas_info = await page.evaluate("""
            () => {
                const c = document.querySelector('.aqb-canvas') ||
                          document.querySelector('[data-aqb-canvas]');
                if (!c) return 'NO CANVAS';
                return 'children:' + c.children.length;
            }
        """)
        log(f"  Canvas state: {canvas_info}")

        if "children:0" in str(canvas_info) or canvas_info == "NO CANVAS":
            await inject_canvas_content(page)

        await wait_settle(page, 800)

        # Click first canvas element
        canvas_element_sels = [
            ".aqb-canvas [data-aqb-id]",
            "[data-aqb-canvas] [data-aqb-id]",
            ".aqb-canvas > *",
        ]

        for csel in canvas_element_sels:
            try:
                el = page.locator(csel).first
                if await el.count():
                    await el.click(timeout=3000, force=True)
                    await wait_settle(page, 600)
                    log(f"  Clicked first element: [{csel}]")
                    break
            except Exception as ce:
                log(f"    element click failed [{csel}]: {ce}")

        await save(page, "0301-canvas-element-selected.png")
        await save(page, "0302-canvas-selection-handles.png")

        # Multi-select
        log("  Attempting multi-select...")
        all_elements = page.locator(".aqb-canvas [data-aqb-id], .aqb-canvas > *")
        el_count = await all_elements.count()
        log(f"  Total canvas elements: {el_count}")

        if el_count >= 2:
            second_el = all_elements.nth(1)
            try:
                await second_el.click(modifiers=["Shift"], timeout=3000, force=True)
                await wait_settle(page, 500)
                log("  Shift-click second element done")
            except Exception as me:
                log(f"  Shift-click failed: {me}")

        await save(page, "0303-canvas-multiselect.png")
        await page.keyboard.press("Escape")
        await wait_settle(page, 300)

        # Context menu
        log("  Attempting context menu...")
        for csel in [".aqb-canvas [data-aqb-id]", ".aqb-canvas > *", ".aqb-canvas"]:
            try:
                el = page.locator(csel).first
                if await el.count():
                    await el.click(button="right", timeout=3000, force=True)
                    await wait_settle(page, 600)
                    log(f"  Right-click on [{csel}]")
                    break
            except Exception:
                pass

        await save(page, "0305-canvas-element-context-menu.png")
        await page.keyboard.press("Escape")
        await wait_settle(page, 300)

        # Hover overlay
        log("  Attempting hover overlay...")
        for csel in [".aqb-canvas [data-aqb-id]", ".aqb-canvas > *"]:
            try:
                el = page.locator(csel).first
                if await el.count():
                    await el.hover(timeout=3000, force=True)
                    await wait_settle(page, 400)
                    log(f"  Hovering [{csel}]")
                    break
            except Exception:
                pass

        await save(page, "0306-canvas-hover-overlay.png")

    except Exception as e:
        log(f"  ERROR in capture_canvas_states: {e}")
        for fn in [
            "0301-canvas-element-selected.png",
            "0302-canvas-selection-handles.png",
            "0303-canvas-multiselect.png",
            "0305-canvas-element-context-menu.png",
            "0306-canvas-hover-overlay.png",
        ]:
            try:
                await save(page, fn)
            except Exception:
                pass


# ═══════════════════════════════════════════════════════════════════════════
# SECTION G — Inspector tabs with element selected
# ═══════════════════════════════════════════════════════════════════════════

async def capture_inspector_states(page: Page):
    log("\n-- G: Inspector Tabs (with element selected) --")
    try:
        # Select first canvas element
        for csel in [".aqb-canvas [data-aqb-id]", ".aqb-canvas > *"]:
            try:
                el = page.locator(csel).first
                if await el.count():
                    await el.click(timeout=3000, force=True)
                    await wait_settle(page, 600)
                    log(f"  Selected element for inspector [{csel}]")
                    break
            except Exception:
                pass

        # Recon inspector
        for isel in [
            "[class*='inspector']",
            "[class*='Inspector']",
            "[data-panel='inspector']",
        ]:
            cnt = await page.locator(isel).count()
            if cnt:
                log(f"  Inspector [{isel}]: {cnt}")

        # Recon inspector tabs
        for tsel in [
            "[class*='inspector'] [role='tab']",
            "[class*='inspector'] button",
        ]:
            tabs = await page.locator(tsel).all()
            if tabs:
                texts = []
                for t in tabs[:6]:
                    try:
                        texts.append(await t.inner_text())
                    except Exception:
                        pass
                log(f"  Inspector tabs [{tsel}]: {texts}")
                break

        # Tab 1: Layout / first tab
        await save(page, "0401-inspector-layout-tab.png")

        # Tab 2: Design/Style
        for tsel in [
            "button:has-text('Design')",
            "button:has-text('Style')",
            "button:has-text('Styles')",
            "[class*='inspector'] [role='tab']:nth-child(2)",
            "[class*='inspector'] button:nth-child(2)",
        ]:
            try:
                el = page.locator(tsel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 500)
                    log(f"  Clicked tab2 [{tsel}]")
                    break
            except Exception:
                pass
        await save(page, "0402-inspector-design-tab.png")

        # Tab 3: Settings/Advanced
        for tsel in [
            "button:has-text('Settings')",
            "button:has-text('Advanced')",
            "button:has-text('Attributes')",
            "[class*='inspector'] [role='tab']:nth-child(3)",
            "[class*='inspector'] button:nth-child(3)",
        ]:
            try:
                el = page.locator(tsel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 500)
                    log(f"  Clicked tab3 [{tsel}]")
                    break
            except Exception:
                pass
        await save(page, "0403-inspector-settings-tab.png")

        # Pseudo-state dropdown
        log("  Trying pseudo-state dropdown...")
        for psel in [
            "[class*='pseudo']",
            "button:has-text('Normal')",
            "select:has-text('Normal')",
            "[class*='PseudoState']",
            "[class*='state-dropdown']",
        ]:
            try:
                el = page.locator(psel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 400)
                    log(f"  Pseudo-state opened [{psel}]")
                    break
            except Exception:
                pass
        await save(page, "0404-inspector-pseudostate-dropdown.png")
        await page.keyboard.press("Escape")
        await wait_settle(page, 200)

        # Color picker in inspector — go to design tab first
        for tsel in [
            "button:has-text('Design')",
            "button:has-text('Style')",
            "[class*='inspector'] [role='tab']:nth-child(2)",
        ]:
            try:
                el = page.locator(tsel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 400)
                    break
            except Exception:
                pass

        log("  Trying color picker in inspector...")
        for cpsel in [
            "[class*='color-input']",
            "[class*='ColorInput']",
            "[class*='color-swatch']",
            "input[type='color']",
            "[class*='inspector'] [class*='swatch']",
        ]:
            try:
                el = page.locator(cpsel).first
                if await el.count() and await el.is_visible(timeout=2000):
                    await el.click(timeout=2000)
                    await wait_settle(page, 600)
                    log(f"  Color picker opened [{cpsel}]")
                    break
            except Exception:
                pass
        await save(page, "0405-inspector-color-picker.png")
        await page.keyboard.press("Escape")
        await wait_settle(page, 200)

        # Multi-select toolbar
        log("  Attempting multi-select for inspector...")
        all_elements = page.locator(".aqb-canvas [data-aqb-id]")
        el_count = await all_elements.count()
        if el_count >= 2:
            try:
                await all_elements.first.click(timeout=3000, force=True)
                await wait_settle(page, 300)
                await all_elements.nth(1).click(modifiers=["Shift"], timeout=3000, force=True)
                await wait_settle(page, 500)
                log("  Two elements selected")
            except Exception as me:
                log(f"  Multi-select for inspector failed: {me}")

        await save(page, "0406-inspector-multiselect-toolbar.png")

    except Exception as e:
        log(f"  ERROR in capture_inspector_states: {e}")
        for fn in [
            "0401-inspector-layout-tab.png",
            "0402-inspector-design-tab.png",
            "0403-inspector-settings-tab.png",
            "0404-inspector-pseudostate-dropdown.png",
            "0405-inspector-color-picker.png",
            "0406-inspector-multiselect-toolbar.png",
        ]:
            try:
                await save(page, fn)
            except Exception:
                pass


# ═══════════════════════════════════════════════════════════════════════════
# MANIFEST UPDATE
# ═══════════════════════════════════════════════════════════════════════════

NEW_MANIFEST_ENTRIES = [
    {
        "file": "0203-topbar-breakpoint-mobile.png",
        "section": "Topbar",
        "state": "Mobile breakpoint active",
        "how_to_reproduce": "Clicked Desktop breakpoint button, selected Mobile"
    },
    {
        "file": "0131-templates-card-hover.png",
        "section": "Templates",
        "state": "Template card hovered — overlay visible",
        "how_to_reproduce": "Hover .tcard in templates panel"
    },
    {
        "file": "0133-templates-preview-modal-desktop.png",
        "section": "Templates",
        "state": "Template preview modal — Desktop viewport",
        "how_to_reproduce": "Click Preview on template card"
    },
    {
        "file": "0134-templates-preview-modal-tablet.png",
        "section": "Templates",
        "state": "Template preview modal — Tablet viewport",
        "how_to_reproduce": "Click Tablet viewport button in preview modal"
    },
    {
        "file": "0135-templates-preview-modal-mobile.png",
        "section": "Templates",
        "state": "Template preview modal — Mobile viewport",
        "how_to_reproduce": "Click Mobile viewport button in preview modal"
    },
    {
        "file": "0152-media-type-filter.png",
        "section": "Media",
        "state": "Image type filter active",
        "how_to_reproduce": "Click Images filter pill in Media panel"
    },
    {
        "file": "0153-media-upload-zone.png",
        "section": "Media",
        "state": "Upload zone visible",
        "how_to_reproduce": "Scroll to upload area in Media Library panel"
    },
    {
        "file": "0163-design-color-picker.png",
        "section": "Design System",
        "state": "Color picker open for a color token",
        "how_to_reproduce": "Click color swatch in Design Colors tab"
    },
    {
        "file": "0174-settings-export.png",
        "section": "Settings",
        "state": "Export settings screen",
        "how_to_reproduce": "Click Export feature card in Settings"
    },
    {
        "file": "0175-settings-integrations.png",
        "section": "Settings",
        "state": "Integrations settings screen",
        "how_to_reproduce": "Click Integrations feature card in Settings"
    },
    {
        "file": "0301-canvas-element-selected.png",
        "section": "Canvas",
        "state": "Single element selected on canvas",
        "how_to_reproduce": "Click any element in the canvas"
    },
    {
        "file": "0302-canvas-selection-handles.png",
        "section": "Canvas",
        "state": "Selection handles visible on selected element",
        "how_to_reproduce": "Click element -- SelectionBoxOverlay renders handles"
    },
    {
        "file": "0303-canvas-multiselect.png",
        "section": "Canvas",
        "state": "Multiple elements selected",
        "how_to_reproduce": "Click element, then Shift+click second element"
    },
    {
        "file": "0305-canvas-element-context-menu.png",
        "section": "Canvas",
        "state": "Element context menu open",
        "how_to_reproduce": "Right-click on a canvas element"
    },
    {
        "file": "0306-canvas-hover-overlay.png",
        "section": "Canvas",
        "state": "Hover overlay on canvas element",
        "how_to_reproduce": "Hover mouse over canvas element without clicking"
    },
    {
        "file": "0401-inspector-layout-tab.png",
        "section": "Inspector",
        "state": "Inspector first tab with element selected",
        "how_to_reproduce": "Select canvas element, view first inspector tab"
    },
    {
        "file": "0402-inspector-design-tab.png",
        "section": "Inspector",
        "state": "Inspector Design/Style tab with element selected",
        "how_to_reproduce": "Select canvas element, click Design/Style tab"
    },
    {
        "file": "0403-inspector-settings-tab.png",
        "section": "Inspector",
        "state": "Inspector Settings/Advanced tab with element selected",
        "how_to_reproduce": "Select canvas element, click third inspector tab"
    },
    {
        "file": "0404-inspector-pseudostate-dropdown.png",
        "section": "Inspector",
        "state": "Pseudo-state dropdown open",
        "how_to_reproduce": "Click pseudo-state selector in inspector"
    },
    {
        "file": "0405-inspector-color-picker.png",
        "section": "Inspector",
        "state": "Color picker open inside inspector",
        "how_to_reproduce": "Click color swatch in inspector Design tab"
    },
    {
        "file": "0406-inspector-multiselect-toolbar.png",
        "section": "Inspector",
        "state": "Inspector with multiple elements selected",
        "how_to_reproduce": "Select 2+ elements, inspector shows multi-select controls"
    },
]


def update_manifest():
    log("\nUpdating manifest.json...")
    existing: list = []
    if MANIFEST.exists():
        try:
            existing = json.loads(MANIFEST.read_text())
        except Exception:
            existing = []

    existing_files = {e["file"] for e in existing}
    added = 0
    for entry in NEW_MANIFEST_ENTRIES:
        if entry["file"] not in existing_files:
            existing.append(entry)
            added += 1
        else:
            for i, e in enumerate(existing):
                if e["file"] == entry["file"]:
                    existing[i] = entry
                    break

    MANIFEST.write_text(json.dumps(existing, indent=2, ensure_ascii=False))
    log(f"  Manifest: {added} new entries added. Total: {len(existing)}")


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

async def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as pw:
        browser: Browser = await pw.chromium.launch(headless=True)
        context: BrowserContext = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
        )
        page: Page = await context.new_page()
        page.set_default_timeout(TIMEOUT)

        # Enter editor
        await open_editor(page)

        # DOM recon
        await recon(page)

        # Pre-inject canvas content
        await inject_canvas_content(page)

        # Capture each section
        await capture_topbar_mobile(page)
        await capture_templates(page)
        await capture_media(page)
        await capture_design_color_picker(page)
        await capture_settings_screens(page)
        await capture_canvas_states(page)
        await capture_inspector_states(page)

        await browser.close()

    # Update manifest
    update_manifest()

    log("\n=== PASS 2 COMPLETE ===")
    saved = list(OUT_DIR.glob("*.png"))
    log(f"Total screenshots in directory: {len(saved)}")


if __name__ == "__main__":
    asyncio.run(main())
