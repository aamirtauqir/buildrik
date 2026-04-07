"""
capture_screenshots.py — Aquibra Editor UI Screenshot Library
Captures ALL UI states: tabs, panels, modals, context menus, overlays, toasts.

Usage:
    python capture_screenshots.py

Requirements:
    pip install playwright
    playwright install chromium
"""

import os
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, Page, Browser

# ─── Config ───────────────────────────────────────────────────────────────────

BASE_URL = "http://localhost:5173"
OUTPUT_DIR = Path(__file__).parent / "latest-screenshots"
VIEWPORT = {"width": 1440, "height": 900}
SETTLE_MS = 700          # default settle after interactions
TOOLTIP_SETTLE_MS = 800  # settle after hover for CSS tooltips

manifest: list[dict] = []

# ─── Helpers ──────────────────────────────────────────────────────────────────

def shoot(page: Page, filename: str, full_page: bool = False, note: str = "") -> None:
    """Wait for settle, take screenshot, log it."""
    page.wait_for_timeout(SETTLE_MS)
    path = OUTPUT_DIR / filename
    page.screenshot(path=str(path), full_page=full_page)
    print(f"  ✓ {filename}")
    return filename


def add_manifest(file: str, section: str, state: str, how: str) -> None:
    manifest.append({
        "file": file,
        "section": section,
        "state": state,
        "how_to_reproduce": how,
    })


def settle(page: Page, ms: int = SETTLE_MS) -> None:
    page.wait_for_timeout(ms)


def safe_click(page: Page, selector: str, timeout: int = 5000) -> bool:
    try:
        page.click(selector, timeout=timeout)
        return True
    except Exception as e:
        print(f"    ⚠ Could not click {selector!r}: {e}")
        return False


def safe_hover(page: Page, selector: str, timeout: int = 5000) -> bool:
    try:
        page.hover(selector, timeout=timeout)
        return True
    except Exception as e:
        print(f"    ⚠ Could not hover {selector!r}: {e}")
        return False


def escape(page: Page) -> None:
    page.keyboard.press("Escape")
    settle(page, 400)


def click_rail_tab(page: Page, tab_id: str) -> bool:
    """Click a left-rail tab by its data-tab attribute."""
    selector = f'[id="rail-tab-{tab_id}"]'
    return safe_click(page, selector)


# ─── Section Capturers ────────────────────────────────────────────────────────

def capture_entry(page: Page) -> None:
    print("\n[A] Entry + Baseline")

    # Load app
    page.goto(BASE_URL, wait_until="networkidle")
    settle(page, 1500)
    fn = "0000-app-load.png"
    shoot(page, fn)
    add_manifest(fn, "Entry", "Initial app load", f"Navigate to {BASE_URL}")

    # Check if there's a login wall
    if page.locator("input[type='email'], input[type='password']").count() > 0:
        print("  ⚠ Login wall detected — capturing and stopping navigation")
        fn = "0001-login-wall.png"
        shoot(page, fn)
        add_manifest(fn, "Entry", "Login screen", "App loaded with auth wall")
        return

    # Dashboard / project list
    settle(page, 1000)
    fn = "0010-dashboard.png"
    shoot(page, fn)
    add_manifest(fn, "Entry", "Dashboard / project list", "Loaded app root URL")

    # Try to enter editor — look for any clickable project card / template / open button
    entered = False
    for selector in [
        "[data-testid='project-card']",
        ".project-card",
        "text=Open",
        "text=Edit",
        "a[href*='/editor']",
        "a[href*='/project']",
        "button:has-text('Open')",
        "button:has-text('Edit')",
        ".card",
        "[class*='project']",
        "[class*='template']",
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click()
                page.wait_for_load_state("networkidle", timeout=15000)
                settle(page, 2000)
                entered = True
                print(f"  → Entered editor via: {selector}")
                break
        except Exception:
            continue

    if not entered:
        print("  ⚠ Could not find project entry point — may already be in editor")

    settle(page, 1500)
    fn = "0100-editor-default.png"
    shoot(page, fn)
    add_manifest(fn, "Editor", "Default layout", "Editor opened, nothing selected")


def capture_topbar(page: Page) -> None:
    print("\n[B] Topbar")

    fn = "0200-topbar-default.png"
    shoot(page, fn)
    add_manifest(fn, "Topbar", "Default rest state", "View topbar with no menus open")

    # Breakpoint dropdown — try to find it
    for selector in [
        'button[aria-label*="breakpoint" i]',
        'button[aria-label*="device" i]',
        'button[title*="Desktop" i]',
        'button:has-text("Desktop")',
        '[data-testid="breakpoint-selector"]',
        '.breakpoint-dropdown',
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click()
                settle(page, 500)
                fn = "0201-topbar-breakpoint-dropdown.png"
                shoot(page, fn)
                add_manifest(fn, "Topbar", "Breakpoint dropdown open", f"Clicked {selector}")

                # Try Tablet option
                for t in ['button:has-text("Tablet")', 'text=Tablet', '[data-value="tablet"]']:
                    try:
                        page.locator(t).first.click(timeout=2000)
                        settle(page)
                        fn = "0202-topbar-breakpoint-tablet.png"
                        shoot(page, fn)
                        add_manifest(fn, "Topbar", "Tablet breakpoint active", "Selected Tablet in breakpoint dropdown")
                        break
                    except Exception:
                        continue

                # Try Mobile option
                for t in ['button:has-text("Mobile")', 'text=Mobile', '[data-value="mobile"]']:
                    try:
                        page.locator(t).first.click(timeout=2000)
                        settle(page)
                        fn = "0203-topbar-breakpoint-mobile.png"
                        shoot(page, fn)
                        add_manifest(fn, "Topbar", "Mobile breakpoint active", "Selected Mobile in breakpoint dropdown")
                        break
                    except Exception:
                        continue

                # Reset to Desktop
                for t in ['button:has-text("Desktop")', 'text=Desktop', '[data-value="desktop"]']:
                    try:
                        page.locator(t).first.click(timeout=2000)
                        settle(page)
                        break
                    except Exception:
                        continue
                break
        except Exception:
            continue


def capture_rail_tooltips(page: Page) -> None:
    print("\n[C] Rail Tooltips")

    tabs = [
        ("templates", "Templates", "0110-rail-tooltip-templates.png"),
        ("pages", "Pages", "0111-rail-tooltip-pages.png"),
        ("add", "Build", "0112-rail-tooltip-build.png"),
        ("assets", "Media Library", "0113-rail-tooltip-media.png"),
        ("design", "Design System", "0114-rail-tooltip-design.png"),
        ("settings", "Config & Launch", "0115-rail-tooltip-settings.png"),
        ("layers", "Layers", "0116-rail-tooltip-layers.png"),
        ("history", "Version history", "0117-rail-tooltip-history.png"),
    ]

    for tab_id, label, fn in tabs:
        selector = f'[id="rail-tab-{tab_id}"]'
        if safe_hover(page, selector):
            settle(page, TOOLTIP_SETTLE_MS)
            shoot(page, fn)
            add_manifest(fn, "Left Rail", f"Tooltip for {label}", f"Hover over rail icon id=rail-tab-{tab_id}")
        # Move mouse away to hide tooltip
        page.mouse.move(720, 450)
        settle(page, 300)


def capture_sidebar_tabs(page: Page) -> None:
    print("\n[D] Sidebar Panels — each rail tab")

    tabs = [
        ("templates", "Templates", "0120-leftpanel-tab-templates.png"),
        ("pages", "Pages", "0121-leftpanel-tab-pages.png"),
        ("add", "Build (Add Elements)", "0122-leftpanel-tab-build.png"),
        ("assets", "Media Library", "0123-leftpanel-tab-media.png"),
        ("design", "Design System", "0124-leftpanel-tab-design.png"),
        ("settings", "Settings", "0125-leftpanel-tab-settings.png"),
        ("layers", "Layers", "0126-leftpanel-tab-layers.png"),
        ("history", "History", "0127-leftpanel-tab-history.png"),
    ]

    for tab_id, label, fn in tabs:
        click_rail_tab(page, tab_id)
        settle(page, 800)
        shoot(page, fn)
        add_manifest(fn, "Left Sidebar", f"{label} panel open", f"Click rail-tab-{tab_id}")


def capture_templates_panel(page: Page) -> None:
    print("\n[E] Templates Panel Detail")

    click_rail_tab(page, "templates")
    settle(page, 1000)

    fn = "0130-templates-browse.png"
    shoot(page, fn)
    add_manifest(fn, "Templates", "Browse grid view", "Click Templates rail tab")

    # Hover first template card
    for selector in [
        ".template-card",
        "[class*='template-card']",
        "[class*='templateCard']",
        "[data-testid='template-card']",
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.hover()
                settle(page, 600)
                fn = "0131-templates-card-hover.png"
                shoot(page, fn)
                add_manifest(fn, "Templates", "Template card hover state", f"Hover over first {selector}")
                break
        except Exception:
            continue

    # Search field focus
    for selector in ['input[placeholder*="Search" i]', 'input[type="search"]', '.search-input', '[aria-label*="search" i]']:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click()
                settle(page, 400)
                fn = "0132-templates-search-active.png"
                shoot(page, fn)
                add_manifest(fn, "Templates", "Search field focused", f"Click {selector}")
                escape(page)
                break
        except Exception:
            continue

    # Preview modal — hover card and click Preview button
    for selector in [
        ".template-card",
        "[class*='template-card']",
        "[class*='templateCard']",
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.hover()
                settle(page, 500)
                # Click preview button
                for btn_sel in [
                    'button:has-text("Preview")',
                    'a:has-text("Preview")',
                    '[aria-label*="preview" i]',
                    'button:has-text("→")',
                ]:
                    try:
                        if page.locator(btn_sel).first.is_visible(timeout=1500):
                            page.locator(btn_sel).first.click()
                            settle(page, 1000)
                            fn = "0133-templates-preview-modal-desktop.png"
                            shoot(page, fn)
                            add_manifest(fn, "Templates", "Preview modal - Desktop view", "Hover card → click Preview")

                            # Tablet in modal
                            for t in ['button:has-text("Tablet")', '[aria-label*="tablet" i]']:
                                try:
                                    page.locator(t).first.click(timeout=2000)
                                    settle(page, 600)
                                    fn = "0134-templates-preview-modal-tablet.png"
                                    shoot(page, fn)
                                    add_manifest(fn, "Templates", "Preview modal - Tablet view", "Click Tablet in preview modal")
                                    break
                                except Exception:
                                    continue

                            # Mobile in modal
                            for t in ['button:has-text("Mobile")', '[aria-label*="mobile" i]']:
                                try:
                                    page.locator(t).first.click(timeout=2000)
                                    settle(page, 600)
                                    fn = "0135-templates-preview-modal-mobile.png"
                                    shoot(page, fn)
                                    add_manifest(fn, "Templates", "Preview modal - Mobile view", "Click Mobile in preview modal")
                                    break
                                except Exception:
                                    continue

                            escape(page)
                            settle(page, 500)
                            break
                    except Exception:
                        continue
                break
        except Exception:
            continue


def capture_pages_panel(page: Page) -> None:
    print("\n[F] Pages Panel Detail")

    click_rail_tab(page, "pages")
    settle(page, 800)

    fn = "0140-pages-tab.png"
    shoot(page, fn)
    add_manifest(fn, "Pages", "Pages panel open", "Click Pages rail tab")

    # Context menu on page row
    for selector in [
        ".page-row",
        "[class*='page-row']",
        "[class*='pageRow']",
        "[data-testid='page-row']",
        "[class*='page-item']",
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click(button="right")
                settle(page, 500)
                fn = "0141-pages-context-menu.png"
                shoot(page, fn)
                add_manifest(fn, "Pages", "Page row context menu open", f"Right-click on {selector}")
                escape(page)
                break
        except Exception:
            continue

    # Try kebab/ellipsis button instead
    for selector in [
        ".page-row button",
        "[class*='page'] button[aria-label*='more' i]",
        "[class*='page'] button[aria-label*='menu' i]",
        "button[aria-label*='page options' i]",
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=1500):
                page.locator(selector).first.hover()
                settle(page, 300)
                page.locator(selector).first.click()
                settle(page, 400)
                fn = "0141-pages-context-menu.png"
                if not (OUTPUT_DIR / fn).exists():
                    shoot(page, fn)
                    add_manifest(fn, "Pages", "Page row context menu open", f"Click kebab menu on {selector}")
                escape(page)
                break
        except Exception:
            continue

    # Settings drawer — click Settings in context menu or settings gear
    for selector in [
        'button:has-text("Settings")',
        '[aria-label*="Page settings" i]',
        'button[aria-label*="settings" i]',
        '.page-settings-btn',
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=1500):
                page.locator(selector).first.click()
                settle(page, 800)
                fn = "0142-pages-settings-drawer-seo.png"
                shoot(page, fn)
                add_manifest(fn, "Pages", "Page settings drawer - SEO tab", f"Click {selector}")

                # Social tab
                for t in ['button:has-text("Social")', 'text=Social']:
                    try:
                        page.locator(t).first.click(timeout=2000)
                        settle(page, 500)
                        fn = "0143-pages-settings-drawer-social.png"
                        shoot(page, fn)
                        add_manifest(fn, "Pages", "Page settings drawer - Social tab", "Click Social tab")
                        break
                    except Exception:
                        continue

                # Advanced tab
                for t in ['button:has-text("Advanced")', 'text=Advanced']:
                    try:
                        page.locator(t).first.click(timeout=2000)
                        settle(page, 500)
                        fn = "0144-pages-settings-drawer-advanced.png"
                        shoot(page, fn)
                        add_manifest(fn, "Pages", "Page settings drawer - Advanced tab", "Click Advanced tab")
                        break
                    except Exception:
                        continue

                # Close drawer
                for t in ['button[aria-label*="close" i]', 'button:has-text("Close")', 'button:has-text("Done")']:
                    try:
                        page.locator(t).first.click(timeout=1500)
                        break
                    except Exception:
                        continue
                escape(page)
                break
        except Exception:
            continue


def capture_media_panel(page: Page) -> None:
    print("\n[G] Media Panel Detail")

    click_rail_tab(page, "assets")
    settle(page, 1000)

    fn = "0150-media-library-view.png"
    shoot(page, fn)
    add_manifest(fn, "Media", "Library view default", "Click Media (Assets) rail tab")

    # Discovery / Stock view tab
    for selector in [
        'button:has-text("Discovery")',
        'button:has-text("Stock")',
        'button:has-text("Browse")',
        '[aria-label*="discovery" i]',
        '[data-view="discovery"]',
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click()
                settle(page, 800)
                fn = "0151-media-discovery-view.png"
                shoot(page, fn)
                add_manifest(fn, "Media", "Discovery view", f"Click {selector}")
                # Switch back to Library
                for t in ['button:has-text("Library")', 'button:has-text("Uploads")', '[data-view="library"]']:
                    try:
                        page.locator(t).first.click(timeout=2000)
                        settle(page, 500)
                        break
                    except Exception:
                        continue
                break
        except Exception:
            continue

    # Type filter pills
    for selector in [
        'button:has-text("Images")',
        'button:has-text("Image")',
        '.type-pill',
        '[class*="typePill"]',
        '[class*="filter-pill"]',
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click()
                settle(page, 500)
                fn = "0152-media-type-filter.png"
                shoot(page, fn)
                add_manifest(fn, "Media", "Type filter active (Images)", f"Click {selector}")
                # Reset filter
                page.locator(selector).first.click()
                settle(page, 300)
                break
        except Exception:
            continue

    # Upload zone
    for selector in [
        '.upload-zone',
        '[class*="uploadZone"]',
        '[class*="upload-zone"]',
        '[aria-label*="upload" i]',
        'button:has-text("Upload")',
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                fn = "0153-media-upload-zone.png"
                shoot(page, fn)
                add_manifest(fn, "Media", "Upload zone visible", f"Scroll to see {selector}")
                break
        except Exception:
            continue


def capture_design_panel(page: Page) -> None:
    print("\n[H] Design System Panel")

    click_rail_tab(page, "design")
    settle(page, 800)

    fn = "0160-design-colors-tab.png"
    shoot(page, fn)
    add_manifest(fn, "Design System", "Colors tab (default)", "Click Design System rail tab")

    # Type tab
    for selector in ['button:has-text("Type")', 'button:has-text("Typography")', '[aria-label*="type tokens" i]']:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click()
                settle(page, 600)
                fn = "0161-design-type-tab.png"
                shoot(page, fn)
                add_manifest(fn, "Design System", "Type tokens tab", f"Click {selector}")
                break
        except Exception:
            continue

    # Spacing tab
    for selector in ['button:has-text("Spacing")', '[aria-label*="spacing tokens" i]']:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click()
                settle(page, 600)
                fn = "0162-design-spacing-tab.png"
                shoot(page, fn)
                add_manifest(fn, "Design System", "Spacing tokens tab", f"Click {selector}")
                break
        except Exception:
            continue

    # Back to Colors
    for selector in ['button:has-text("Color")', 'button:has-text("Colors")', '[aria-label*="color tokens" i]']:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click()
                settle(page, 400)
                break
        except Exception:
            continue

    # Color picker — click a swatch
    for selector in [
        '.color-swatch',
        '[class*="colorSwatch"]',
        '[class*="color-swatch"]',
        'button[aria-label*="color" i]',
        '.color-row button',
        '[class*="colorRow"] button',
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click()
                settle(page, 700)
                fn = "0163-design-color-picker.png"
                shoot(page, fn)
                add_manifest(fn, "Design System", "Color picker open", f"Click color swatch {selector}")
                escape(page)
                settle(page, 400)
                break
        except Exception:
            continue

    # Export dropdown
    for selector in [
        'button:has-text("Export")',
        '[aria-label*="export" i]',
        'button[title*="export" i]',
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click()
                settle(page, 500)
                fn = "0164-design-export-dropdown.png"
                shoot(page, fn)
                add_manifest(fn, "Design System", "Export dropdown open", f"Click {selector}")
                escape(page)
                break
        except Exception:
            continue


def capture_settings_panel(page: Page) -> None:
    print("\n[I] Settings Panel Detail")

    click_rail_tab(page, "settings")
    settle(page, 800)

    fn = "0170-settings-home.png"
    shoot(page, fn)
    add_manifest(fn, "Settings", "Settings home — feature cards", "Click Settings rail tab")

    screens = [
        ("Site Settings", "0171-settings-site-settings.png", "Site Settings"),
        ("Domains", "0172-settings-domains.png", "Domains"),
        ("Analytics", "0173-settings-analytics.png", "Analytics"),
        ("Export", "0174-settings-export.png", "Export"),
        ("Integrations", "0175-settings-integrations.png", "Integrations (may be locked)"),
        ("Advanced", "0176-settings-advanced.png", "Advanced (may be locked)"),
        ("Version History", "0177-settings-version-history.png", "Version History"),
    ]

    for card_text, fn, label in screens:
        # Try clicking back to home first if we're in a drill-in
        for back_sel in ['button[aria-label*="back" i]', 'button:has-text("Back")', '.drill-in-header button', '[class*="drillIn"] button']:
            try:
                if page.locator(back_sel).first.is_visible(timeout=1000):
                    page.locator(back_sel).first.click()
                    settle(page, 500)
                    break
            except Exception:
                continue

        for selector in [
            f'text={card_text}',
            f'button:has-text("{card_text}")',
            f'[aria-label*="{card_text}" i]',
            f'[class*="featureCard"]:has-text("{card_text}")',
            f'[class*="feature-card"]:has-text("{card_text}")',
        ]:
            try:
                if page.locator(selector).first.is_visible(timeout=2000):
                    page.locator(selector).first.click()
                    settle(page, 800)
                    shoot(page, fn)
                    add_manifest(fn, "Settings", label, f"Click '{card_text}' feature card")
                    break
            except Exception:
                continue


def capture_publish_panel(page: Page) -> None:
    print("\n[J] Publish Panel")

    # Publish tab is accessible from settings or a dedicated rail button
    # Try directly from the bottom rail area (no dedicated rail slot in config, but may be accessible)
    # Actually from tabsConfig.ts: publish is in GROUPED_TABS_CONFIG but NOT in RAIL_SLOTS
    # It might be accessible from the settings panel or a topbar button

    # Try topbar publish button
    for selector in [
        'button:has-text("Publish")',
        '[aria-label*="publish" i]',
        '#publish-btn',
        '.publish-btn',
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                # Just screenshot — don't actually publish
                fn = "0180-publish-tab.png"
                shoot(page, fn)
                add_manifest(fn, "Publish", "Publish panel/state", f"Visible via {selector}")
                break
        except Exception:
            continue


def capture_footer_toolbar(page: Page) -> None:
    print("\n[K] Canvas Footer Toolbar")

    # Close sidebar first for clean canvas view
    escape(page)
    settle(page, 300)

    fn = "0210-footer-toolbar-default.png"
    shoot(page, fn)
    add_manifest(fn, "Canvas Footer", "Footer toolbar default — all overlays off", "View canvas footer area")

    overlays = [
        ("Snap Guides", "0211-footer-toolbar-guides-on.png", "Snap Guides toggled on"),
        ("Spacing", "0212-footer-toolbar-spacing-on.png", "Spacing overlay toggled on"),
        ("Grid", "0213-footer-toolbar-grid-on.png", "Grid overlay toggled on"),
        ("Badges", "0214-footer-toolbar-badges-on.png", "Badges overlay toggled on"),
        ("X-Ray", "0215-footer-toolbar-xray-on.png", "X-Ray overlay toggled on"),
    ]

    for label, fn, state in overlays:
        selector = f'button[aria-label="{label}"]'
        if safe_click(page, selector, timeout=3000):
            settle(page, 500)
            shoot(page, fn)
            add_manifest(fn, "Canvas Footer", state, f"Click '{label}' overlay button")
            # Toggle off to reset
            safe_click(page, selector, timeout=2000)
            settle(page, 300)

    # Zoom preset dropdown
    for selector in ['button[aria-label="Zoom presets"]', 'button[title="Click for zoom presets"]']:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click()
                settle(page, 500)
                fn = "0216-footer-zoom-dropdown.png"
                shoot(page, fn)
                add_manifest(fn, "Canvas Footer", "Zoom preset dropdown open", f"Click zoom % button")
                escape(page)
                break
        except Exception:
            continue


def capture_canvas_interactions(page: Page) -> None:
    print("\n[L] Canvas Interactions")

    # Ensure we're in default state — click somewhere empty to deselect
    escape(page)
    settle(page, 300)

    fn = "0300-canvas-empty.png"
    shoot(page, fn)
    add_manifest(fn, "Canvas", "Canvas with no element selected", "Click empty area of canvas")

    # Try to select an element — look for canvas content
    canvas_selectors = [
        '[data-element-id]',
        '[data-element]',
        '[class*="canvas-element"]',
        '[class*="canvasElement"]',
        '.canvas-frame > *',
        '#canvas-root > *',
        '.canvas-content > *',
    ]

    element_selected = False
    for selector in canvas_selectors:
        try:
            els = page.locator(selector)
            if els.count() > 0 and els.first.is_visible(timeout=2000):
                els.first.click()
                settle(page, 600)
                fn = "0301-canvas-element-selected.png"
                shoot(page, fn)
                add_manifest(fn, "Canvas", "Single element selected", f"Click element via {selector}")
                element_selected = True

                fn = "0302-canvas-selection-handles.png"
                shoot(page, fn)
                add_manifest(fn, "Canvas", "Selection box + resize handles", "Element selected, showing handles")

                # Multi-select: shift-click another element
                all_els = els.all()
                if len(all_els) > 1:
                    try:
                        page.keyboard.down("Shift")
                        all_els[1].click()
                        page.keyboard.up("Shift")
                        settle(page, 600)
                        fn = "0303-canvas-multiselect.png"
                        shoot(page, fn)
                        add_manifest(fn, "Canvas", "Multi-select (2 elements)", "Shift+click second element")
                        # Deselect
                        escape(page)
                        settle(page, 300)
                    except Exception as e:
                        print(f"    ⚠ Multi-select failed: {e}")
                        page.keyboard.up("Shift")

                break
        except Exception:
            continue

    # Hover overlay — hover without clicking
    for selector in canvas_selectors:
        try:
            els = page.locator(selector)
            if els.count() > 0 and els.first.is_visible(timeout=2000):
                # First click empty canvas to deselect
                try:
                    page.mouse.click(720, 600)
                    settle(page, 300)
                except Exception:
                    pass
                els.first.hover()
                settle(page, 500)
                fn = "0306-canvas-hover-overlay.png"
                shoot(page, fn)
                add_manifest(fn, "Canvas", "Element hover overlay", f"Hover over element via {selector}")
                break
        except Exception:
            continue

    # Right-click canvas empty area
    try:
        page.mouse.click(720, 600)  # click to deselect
        settle(page, 200)
        page.mouse.click(720, 600, button="right")
        settle(page, 600)
        fn = "0304-canvas-context-menu.png"
        shoot(page, fn)
        add_manifest(fn, "Canvas", "Canvas context menu (empty area)", "Right-click empty canvas area")
        escape(page)
    except Exception as e:
        print(f"    ⚠ Canvas context menu failed: {e}")

    # Right-click selected element
    if element_selected:
        for selector in canvas_selectors:
            try:
                els = page.locator(selector)
                if els.count() > 0 and els.first.is_visible(timeout=2000):
                    els.first.click(button="right")
                    settle(page, 600)
                    fn = "0305-canvas-element-context-menu.png"
                    shoot(page, fn)
                    add_manifest(fn, "Canvas", "Element context menu", f"Right-click element via {selector}")
                    escape(page)
                    break
            except Exception:
                continue


def capture_inspector(page: Page) -> None:
    print("\n[M] Right Inspector")

    # First deselect all
    escape(page)
    try:
        page.mouse.click(720, 450)
        settle(page, 400)
    except Exception:
        pass

    fn = "0400-inspector-empty.png"
    shoot(page, fn)
    add_manifest(fn, "Inspector", "Empty state — no element selected", "Click empty canvas area to deselect all")

    # Select an element
    canvas_selectors = [
        '[data-element-id]',
        '[data-element]',
        '[class*="canvas-element"]',
        '[class*="canvasElement"]',
        '.canvas-frame > *',
        '#canvas-root > *',
    ]

    element_clicked = False
    for selector in canvas_selectors:
        try:
            els = page.locator(selector)
            if els.count() > 0 and els.first.is_visible(timeout=2000):
                els.first.click()
                settle(page, 700)
                element_clicked = True
                break
        except Exception:
            continue

    if element_clicked:
        fn = "0401-inspector-layout-tab.png"
        shoot(page, fn)
        add_manifest(fn, "Inspector", "Layout tab — element selected", "Click element → Layout tab in inspector")

        # Design/Style tab
        for selector in [
            'button:has-text("Design")',
            'button:has-text("Style")',
            '[role="tab"]:has-text("Design")',
            '[role="tab"]:has-text("Style")',
            '.inspector-tab:has-text("Design")',
            '.inspector-tab:has-text("Style")',
        ]:
            try:
                if page.locator(selector).first.is_visible(timeout=2000):
                    page.locator(selector).first.click()
                    settle(page, 600)
                    fn = "0402-inspector-design-tab.png"
                    shoot(page, fn)
                    add_manifest(fn, "Inspector", "Design/Style tab", f"Click {selector}")
                    break
            except Exception:
                continue

        # Settings/Advanced tab
        for selector in [
            'button:has-text("Settings")',
            'button:has-text("Advanced")',
            '[role="tab"]:has-text("Settings")',
            '[role="tab"]:has-text("Advanced")',
        ]:
            try:
                # Only check inside the inspector panel, not the rail
                inspector_tabs = page.locator('.inspector-tabs button, [class*="inspector"] [role="tab"]')
                matching = [t for t in inspector_tabs.all() if selector.replace('button:has-text(', '').strip('"').strip(")") in (t.inner_text() or "")]
                if matching:
                    matching[0].click()
                    settle(page, 600)
                    fn = "0403-inspector-settings-tab.png"
                    shoot(page, fn)
                    add_manifest(fn, "Inspector", "Settings/Advanced tab", f"Click settings tab in inspector")
                    break
            except Exception:
                continue

        # Back to Layout tab
        for selector in [
            'button:has-text("Layout")',
            '[role="tab"]:has-text("Layout")',
        ]:
            try:
                if page.locator(selector).first.is_visible(timeout=2000):
                    page.locator(selector).first.click()
                    settle(page, 400)
                    break
            except Exception:
                continue

        # Pseudostate dropdown
        for selector in [
            'button[aria-label*="pseudo" i]',
            'button[aria-label*="state" i]',
            '[class*="pseudoState"]',
            '[class*="pseudo-state"]',
            'button:has-text(":hover")',
            'button:has-text("Default")',
            '[class*="stateSelector"]',
        ]:
            try:
                if page.locator(selector).first.is_visible(timeout=2000):
                    page.locator(selector).first.click()
                    settle(page, 500)
                    fn = "0404-inspector-pseudostate-dropdown.png"
                    shoot(page, fn)
                    add_manifest(fn, "Inspector", "Pseudostate selector dropdown", f"Click {selector}")
                    escape(page)
                    break
            except Exception:
                continue

        # Color picker in inspector
        for selector in [
            '.inspector-panel [class*="colorSwatch"]',
            '.inspector-panel [class*="color-swatch"]',
            '[class*="inspector"] button[style*="background"]',
            '[class*="fillColor"]',
            '[class*="fill-color"]',
        ]:
            try:
                if page.locator(selector).first.is_visible(timeout=2000):
                    page.locator(selector).first.click()
                    settle(page, 700)
                    fn = "0405-inspector-color-picker.png"
                    shoot(page, fn)
                    add_manifest(fn, "Inspector", "Color picker in inspector", f"Click color swatch in inspector")
                    escape(page)
                    break
            except Exception:
                continue


def capture_modals(page: Page) -> None:
    print("\n[N] Modals & Dialogs")

    # Keyboard shortcuts — press ? or help button
    for trigger in [
        lambda: page.keyboard.press("?"),
        lambda: safe_click(page, 'button[aria-label="Show keyboard shortcuts (press ? key)"]'),
        lambda: safe_click(page, 'button[aria-label*="keyboard shortcuts" i]'),
    ]:
        try:
            trigger()
            settle(page, 700)
            # Check if a modal/overlay appeared
            if page.locator('[class*="modal"], [class*="sheet"], [class*="overlay"], [role="dialog"]').count() > 0:
                fn = "0500-modal-keyboard-shortcuts.png"
                shoot(page, fn)
                add_manifest(fn, "Modals", "Keyboard shortcuts modal", "Press ? or click help button")
                escape(page)
                settle(page, 400)
                break
        except Exception:
            continue

    # Export modal — via Settings > Export
    click_rail_tab(page, "settings")
    settle(page, 600)
    # Navigate back to home if in drill-in
    for back_sel in ['button[aria-label*="back" i]', 'button:has-text("Back")', '.drill-in-header button']:
        try:
            if page.locator(back_sel).first.is_visible(timeout=800):
                page.locator(back_sel).first.click()
                settle(page, 400)
                break
        except Exception:
            continue
    for selector in ['text=Export', 'button:has-text("Export")', '[class*="featureCard"]:has-text("Export")']:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click()
                settle(page, 600)
                # Now look for a download/export button that opens a modal
                for btn in ['button:has-text("Export")', 'button:has-text("Download")', 'button:has-text("Generate")']:
                    try:
                        if page.locator(btn).first.is_visible(timeout=1500):
                            page.locator(btn).first.click()
                            settle(page, 700)
                            fn = "0502-modal-export.png"
                            shoot(page, fn)
                            add_manifest(fn, "Modals", "Export modal/dialog", "Settings → Export → click Export/Download button")
                            escape(page)
                            break
                    except Exception:
                        continue
                break
        except Exception:
            continue

    # If no export modal found, at least screenshot the export screen
    fn = "0502-modal-export.png"
    if not (OUTPUT_DIR / fn).exists():
        shoot(page, fn)
        add_manifest(fn, "Settings", "Export settings screen", "Settings → Export screen")


def capture_toasts(page: Page) -> None:
    print("\n[O] Toast Notifications")

    # Try actions that trigger toasts
    click_rail_tab(page, "pages")
    settle(page, 600)

    # Copy link action from page context menu
    for selector in [
        '.page-row',
        '[class*="page-row"]',
        '[class*="pageRow"]',
        '[class*="page-item"]',
    ]:
        try:
            if page.locator(selector).first.is_visible(timeout=2000):
                page.locator(selector).first.click(button="right")
                settle(page, 400)
                # Look for copy link
                for t in ['text=Copy link', 'text=Copy Link', 'button:has-text("Copy link")']:
                    try:
                        if page.locator(t).first.is_visible(timeout=1000):
                            page.locator(t).first.click()
                            settle(page, 800)
                            fn = "0600-toast-notification.png"
                            shoot(page, fn)
                            add_manifest(fn, "Notifications", "Toast after copy link", "Right-click page → Copy link")
                            return
                    except Exception:
                        continue
                escape(page)
                break
        except Exception:
            continue

    # Fallback: Cmd+Z undo triggers a toast
    try:
        page.keyboard.press("Meta+Z")
        settle(page, 600)
        # Check for toast
        for t in ['[class*="toast"]', '[role="status"]', '[class*="notification"]', '[class*="snackbar"]']:
            if page.locator(t).count() > 0:
                fn = "0600-toast-notification.png"
                shoot(page, fn)
                add_manifest(fn, "Notifications", "Toast notification (undo)", "Press Cmd+Z → undo toast appears")
                break
        page.keyboard.press("Meta+Shift+Z")  # redo
    except Exception:
        pass


def capture_all_remaining(page: Page) -> None:
    """Capture any states not yet caught — final pass."""
    print("\n[P] Final Pass — remaining states")

    # Inspector empty state again (clean)
    click_rail_tab(page, "add")
    settle(page, 500)
    fn = "0700-empty-inspector.png"
    shoot(page, fn)
    add_manifest(fn, "Empty States", "Inspector empty state visible with Build panel", "Open Add panel, no element selected")

    # Layers panel
    click_rail_tab(page, "layers")
    settle(page, 600)
    fn = "0720-leftpanel-layers-detail.png"
    shoot(page, fn)
    add_manifest(fn, "Layers", "Layers tree panel", "Click Layers rail button (footer)")

    # History panel
    click_rail_tab(page, "history")
    settle(page, 600)
    fn = "0730-leftpanel-history-detail.png"
    shoot(page, fn)
    add_manifest(fn, "History", "History / versions panel", "Click History rail button (footer)")


# ─── Manifest + README Writers ────────────────────────────────────────────────

def write_manifest() -> None:
    path = OUTPUT_DIR / "manifest.json"
    path.write_text(json.dumps(manifest, indent=2))
    print(f"\n✓ manifest.json — {len(manifest)} entries")


def write_readme() -> None:
    sections: dict[str, list[dict]] = {}
    for item in manifest:
        s = item["section"]
        sections.setdefault(s, []).append(item)

    lines = [
        "# Aquibra Editor — Screenshot Library",
        "",
        f"**Total screenshots:** {len(manifest)}  ",
        f"**Generated:** {time.strftime('%Y-%m-%d %H:%M')}  ",
        "",
        "---",
        "",
    ]

    for section, items in sections.items():
        lines.append(f"## {section}")
        lines.append("")
        for item in items:
            lines.append(f"### `{item['file']}`")
            lines.append(f"- **State:** {item['state']}")
            lines.append(f"- **How to reproduce:** {item['how_to_reproduce']}")
            lines.append(f"- ![{item['file']}]({item['file']})")
            lines.append("")

    path = OUTPUT_DIR / "README.md"
    path.write_text("\n".join(lines))
    print(f"✓ README.md")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    print(f"Output dir: {OUTPUT_DIR}")
    print(f"Viewport: {VIEWPORT['width']}×{VIEWPORT['height']}")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport=VIEWPORT,
            # Reduce motion to prevent animation blur
            reduced_motion="reduce",
            # Force color scheme
            color_scheme="dark",
        )
        # Emulate reduced motion via CSS
        page = ctx.new_page()

        try:
            capture_entry(page)
            capture_topbar(page)
            capture_rail_tooltips(page)
            capture_sidebar_tabs(page)
            capture_templates_panel(page)
            capture_pages_panel(page)
            capture_media_panel(page)
            capture_design_panel(page)
            capture_settings_panel(page)
            capture_publish_panel(page)
            capture_footer_toolbar(page)
            capture_canvas_interactions(page)
            capture_inspector(page)
            capture_modals(page)
            capture_toasts(page)
            capture_all_remaining(page)

        except Exception as e:
            print(f"\n✗ Fatal error: {e}")
            import traceback
            traceback.print_exc()
            try:
                page.screenshot(path=str(OUTPUT_DIR / "9999-fatal-error.png"))
            except Exception:
                pass
        finally:
            browser.close()

    write_manifest()
    write_readme()

    pngs = list(OUTPUT_DIR.glob("*.png"))
    print(f"\n{'═'*50}")
    print(f"Done! {len(pngs)} screenshots in {OUTPUT_DIR}/")
    print(f"{'═'*50}")


if __name__ == "__main__":
    main()
