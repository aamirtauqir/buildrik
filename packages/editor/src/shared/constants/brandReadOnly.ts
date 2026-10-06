/** Why Brand is read-only. A migration failure carries its own reason text;
 *  these two are the operator-set causes (kill switch, per-site hold). */
export const BRAND_READ_ONLY_SWITCH_OFF = "switch_off";
export const BRAND_READ_ONLY_HELD = "held";
/** Saved v6 rows that fail validation: shown with the failed-migration copy. */
export const BRAND_READ_ONLY_FAILED = "failed";

export const BRAND_READ_ONLY_COPY: Readonly<Record<string, string>> = {
  [BRAND_READ_ONLY_SWITCH_OFF]: "Brand editing is paused while we upgrade brand tokens.",
  [BRAND_READ_ONLY_HELD]: "This site's brand was rolled back — editing is paused.",
};

/** Notice for any other reason: the migration itself failed. */
export const BRAND_READ_ONLY_FAILED_COPY = "We couldn't upgrade this site's brand — nothing was changed. Editing is paused.";
