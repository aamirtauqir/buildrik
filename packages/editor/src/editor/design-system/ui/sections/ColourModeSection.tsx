/**
 * ColourModeSection — Brand › Colour mode, board 7316:80949 (C1 (ii); was
 * the drawer's 153:92).
 *
 * One bordered card, a 48px row per colour token: the id, then either "No dark
 * value" with a Set action, or "#LIGHT → #DARK" with a check. The tokens that
 * still need a value come first — that is what the page is for. The Light /
 * Dark switch is not on this page any more: the board draws it inside the
 * live preview card, so the workspace passes it there.
 *
 * Deferred at M5 with the reason "its board lists tokens with NO DARK VALUE
 * plus a Set action each, and that query is not known to exist on the
 * registries". Both halves are true now and neither was quite what I said:
 *
 *   · The QUERY was always there — `ColorTokenList` computes exactly this at
 *     :243. What is NOT the query is `DSLinter`'s `missing-dark` rule, which
 *     only fires when the project already holds at least one darkValue
 *     (DSLinter.ts:141), so it would report nothing on the project that needs
 *     this screen most.
 *   · The WRITE was genuinely missing, and worse than missing: TokenDetailView
 *     had a dark-value input with an empty onBlur that discarded what you
 *     typed. Fixed earlier today, so `updateToken(id, value, darkValue)` is now
 *     reachable from the UI at all.
 *
 * Set opens "Set the dark-mode value" (7318:80995, G3-146) in place: three
 * shades derived from the light value (`darkShadeSuggestions`), each with its
 * contrast where it will be used; a pick writes the dark value. "Custom…"
 * (not drawn; the free value the inline field used to take) opens the one
 * colour picker.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Check } from "lucide-react";
import { X } from "lucide-react";
import { Button, IconButton, Popover } from "@/editor/chrome-ui";
import { darkShadeSuggestions } from "../../utils/colorUtils";
import { ColorPicker } from "../colors/ColorPicker";
import { useColorRegistry } from "../../state/TokenRegistryContext";
import { useDSModeOptional } from "../../state/DSModeContext";
import { filterTokensByMode } from "../../utils/semanticKind";
import { displayValue } from "../colors/ColorTokenList";
import { BrandCard, BrandRow } from "../BrandCard";

export const ColourModeSection: React.FC = () => {
  const color = useColorRegistry();
  const mode = useDSModeOptional()?.mode ?? "beginner";
  const [editing, setEditing] = React.useState<string | null>(null);
  const [custom, setCustom] = React.useState(false);

  /* The unconditional question — which colour tokens have no dark value — not
     the lint rule, which stays silent until the project has at least one.
     The same mode filter as the Colours page, so the two pages count the same
     palette. */
  const { missing, paired } = React.useMemo(() => {
    const visible = filterTokensByMode(color?.tokens ?? [], mode);
    return {
      missing: visible.filter((t) => !t.darkValue),
      paired: visible.filter((t) => t.darkValue),
    };
  }, [color?.tokens, mode]);

  const commit = (id: string, lightValue: string, darkValue: string) => {
    setEditing(null);
    setCustom(false);
    color.updateToken(id, lightValue, darkValue);
  };
  const open = (id: string) => {
    setCustom(false);
    setEditing(id);
  };

  if (missing.length + paired.length === 0) {
    return (
      <div className="tw:py-6 tw:text-center tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink-muted)]">
        No colour tokens yet.
      </div>
    );
  }

  return (
    <BrandCard label="Colour mode" data-testid="brand-colour-mode-list">
      {/*
        The id, not the display name — the board draws ids, and the live
        palette holds both `Text` and `Text Primary`, so a name cannot say
        which token you are about to give a dark value to. The name stays in
        the title so it is still reachable.
      */}
      {missing.map((t) => (
        <BrandRow
          key={t.id}
          data-no-dark-row={t.id}
          data-testid={`brand-nodark-row-${t.id}`}
          name={<span data-testid={`brand-nodark-name-${t.id}`} title={t.name}>{t.id}</span>}
          sub="No dark value"
          trailing={
            <Popover
              open={editing === t.id}
              onClose={() => setEditing(null)}
              placement="bottom-end"
              label="Set the dark-mode value"
              trigger={
                <Button
                  size="xs"
                  variant="link"
                  data-set-dark={t.id}
                  data-testid={`brand-nodark-set-${t.id}`}
                  aria-haspopup="dialog"
                  aria-expanded={editing === t.id}
                  onClick={() => (editing === t.id ? setEditing(null) : open(t.id))}
                  className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:leading-5 tw:text-[var(--bk-accent-text)]"
                >
                  Set
                </Button>
              }
            >
              {editing === t.id && custom ? (
                <div className="tw:-m-2 tw:overflow-hidden tw:rounded-lg">
                  <ColorPicker
                    initialHex={t.value}
                    title={`${t.id} · dark`}
                    onChange={() => {}}
                    onCancel={() => setCustom(false)}
                    onSave={(hex) => commit(t.id, t.value, hex)}
                  />
                </div>
              ) : editing === t.id ? (
                <div className="tw:flex tw:w-66 tw:flex-col tw:gap-3 tw:p-2" data-testid="dark-shade-popover">
                  <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                    <div className="tw:flex tw:flex-col tw:gap-1">
                      <span className="tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="dark-shade-crumb">
                        Site brand › {t.id}
                      </span>
                      <span className="tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">Set the dark-mode value</span>
                    </div>
                    <IconButton label="Close" onClick={() => setEditing(null)} className="tw:size-5 tw:min-h-0 tw:min-w-0 tw:text-[var(--bk-ink-muted)]">
                      <X size={14} aria-hidden />
                    </IconButton>
                  </div>
                  <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                    Pick the value this token resolves to when the site is in dark mode.
                  </p>
                  <div className="tw:flex tw:flex-col tw:gap-2">
                    {darkShadeSuggestions(t.value).map((sh, i) => (
                      <Button
                        key={sh.hex + sh.label}
                        type="button"
                        onClick={() => commit(t.id, t.value, sh.hex)}
                        data-testid={`dark-shade-option-${i}`}
                        data-hex={sh.hex}
                        className={`tw:h-auto tw:min-h-0 tw:w-full tw:justify-start tw:gap-3 tw:rounded-md tw:border tw:bg-[var(--bk-gray-900)] tw:px-2.5 tw:py-2 tw:text-left tw:enabled:hover:bg-[var(--bk-gray-800)] ${
                          i === 0 ? "tw:border-[var(--bk-accent)]" : "tw:border-transparent"
                        }`}
                      >
                        <span className="tw:size-5 tw:flex-none tw:rounded" style={{ background: sh.hex }} aria-hidden />
                        <span className="tw:flex tw:flex-col">
                          <span className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-white">
                            {sh.hex} · {sh.label}
                          </span>
                          <span className="tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-gray-400)]">
                            contrast {sh.contrast.toFixed(1)}:1
                            {sh.contrast < 3 ? " · fails large text" : sh.contrast < 4.5 ? " · fails body text" : ""}
                          </span>
                        </span>
                      </Button>
                    ))}
                  </div>
                  <div className="tw:flex tw:items-center tw:justify-between tw:border-t tw:border-[var(--bk-border)] tw:pt-3">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setCustom(true)}
                      data-testid="dark-shade-custom"
                      className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[length:var(--bk-text-12)] tw:font-normal tw:text-[var(--bk-accent-text)] tw:enabled:hover:no-underline"
                    >
                      Custom…
                    </Button>
                    <Button type="button" variant="secondary" size="xs" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </Popover>
          }
        />
      ))}
      {paired.map((t) => (
        <BrandRow
          key={t.id}
          data-dark-row={t.id}
          data-testid={`brand-dark-row-${t.id}`}
          name={<span title={t.name}>{t.id}</span>}
          sub={
            <span data-testid={`brand-dark-pair-${t.id}`}>
              {displayValue(t.value)} → {displayValue(t.darkValue ?? "")}
            </span>
          }
          trailing={<Check size={12} aria-label="Has a dark value" className="tw:flex-none tw:text-[var(--bk-ink-muted)]" />}
        />
      ))}
    </BrandCard>
  );
};

export default ColourModeSection;
