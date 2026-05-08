import type { EventEmitter } from "../EventEmitter";
import type { ThemeMode } from "../../editor/design-system";

const STORAGE_KEY = "buildrik:colorMode";
const VALID_MODES: readonly ThemeMode[] = ["light", "dark", "system"];

function readPersisted(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (VALID_MODES as readonly string[]).includes(raw)) {
      return raw as ThemeMode;
    }
  } catch {
    /* localStorage unavailable */
  }
  return "system";
}

function persist(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* private mode / quota exceeded */
  }
}

/**
 * Composer-owned color mode store. Tracks user preference (light/dark/system)
 * and resolves "system" against `prefers-color-scheme: dark`.
 *
 * Emits `colorMode:changed` on user-initiated `set()` AND on system preference
 * change while in "system" mode. Subscribers re-resolve any color-dependent UI.
 */
export class ColorMode {
  private mode: ThemeMode;
  private mql: MediaQueryList | null;

  constructor(private readonly events: EventEmitter) {
    this.mode = readPersisted();
    this.mql = typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

    if (this.mql && typeof this.mql.addEventListener === "function") {
      this.mql.addEventListener("change", this.onSystemChange);
    }
  }

  private onSystemChange = (_e: { matches: boolean }): void => {
    if (this.mode !== "system") return;
    this.events.emit("colorMode:changed", { mode: this.mode, resolved: this.resolved() });
  };

  get(): ThemeMode {
    return this.mode;
  }

  set(mode: ThemeMode): void {
    this.mode = mode;
    persist(mode);
    this.events.emit("colorMode:changed", { mode, resolved: this.resolved() });
  }

  /** Always returns "light" or "dark" — never "system". */
  resolved(): "light" | "dark" {
    if (this.mode === "system") {
      return this.mql?.matches ? "dark" : "light";
    }
    return this.mode;
  }
}
