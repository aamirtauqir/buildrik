/**
 * TokenAddDialog — "+ Add token", as the prototype's generic Edit overlay
 * (7318:81125): a 560 dialog, Name, Properties (the token's value), Cancel ·
 * Save to draft. One dialog for every kind with an add path — colour, spacing
 * and the eleven generic kinds; the value is checked for the kind.
 *
 * Replaces the colour-only AddTokenModal (name + hex).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Label, Modal, TextInput } from "@/editor/chrome-ui";
import type { DesignToken, TokenKind } from "../../types";

export interface TokenAddDialogProps {
  open: boolean;
  kind: TokenKind;
  /** Existing tokens of this kind — the new one copies their category/type. */
  siblings: readonly DesignToken[];
  takenIds: readonly string[];
  onCancel(): void;
  onAdd(token: DesignToken): void;
}

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const PREFIX: Partial<Record<TokenKind, string>> = { color: "color", spacing: "space" };

export function newTokenId(kind: TokenKind, name: string): string {
  return `${PREFIX[kind] ?? kind}-${slug(name)}`;
}

export function valueError(kind: TokenKind, value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter a value.";
  if (kind === "color" && !/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return "Use a hex colour, e.g. #1A56DB.";
  if (kind === "spacing" && !/^\d+(\.\d+)?(px|rem|em)$/.test(v)) return "Use a length, e.g. 24px.";
  return null;
}

const PLACEHOLDER: Partial<Record<TokenKind, string>> = { color: "#1A56DB", spacing: "24px" };

export function TokenAddDialog({ open, kind, siblings, takenIds, onCancel, onAdd }: TokenAddDialogProps) {
  const [name, setName] = React.useState("");
  const [value, setValue] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setName("");
      setValue("");
      setTouched(false);
    }
  }, [open]);

  const id = newTokenId(kind, name);
  const nameErr = !slug(name) ? "Enter a name." : takenIds.includes(id) ? "A token with this name already exists." : null;
  const valErr = valueError(kind, value);

  const submit = () => {
    setTouched(true);
    if (nameErr || valErr) return;
    const like = siblings[0];
    onAdd({
      id,
      name: name.trim(),
      value: kind === "color" ? value.trim().toUpperCase() : value.trim(),
      cssVar: `--buildrick-design-${id}`,
      category: kind === "color" ? "colors" : kind === "spacing" ? "spacing" : (like?.category ?? "layout"),
      type: kind === "color" ? "color" : (like?.type ?? "length"),
      kind,
      ...(kind === "color" ? { group: "brand" } : {}),
    } as DesignToken);
  };

  const err = (m: string | null, tid: string) =>
    touched && m ? (
      <span role="alert" data-testid={tid} className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-error-text)]">
        {m}
      </span>
    ) : null;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Add token"
      kind="form"
      testId="brand-token-add"
      footer={
        <>
          <Button size="xs" variant="secondary" onClick={onCancel} className="tw:h-8! tw:px-3!" data-testid="brand-token-add-cancel">
            Cancel
          </Button>
          <Button size="xs" onClick={submit} className="tw:h-8! tw:px-3!" data-testid="brand-token-add-confirm">
            Save to draft
          </Button>
        </>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-3">
        <div className="tw:flex tw:flex-col tw:gap-1">
          <Label htmlFor="brand-token-add-name" className="tw:text-[length:var(--bk-text-12)] tw:font-normal tw:text-[var(--bk-ink-muted)]">
            Name
          </Label>
          <TextInput
            id="brand-token-add-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            data-testid="brand-token-add-name"
          />
          {err(nameErr, "brand-token-add-name-error")}
        </div>
        <div className="tw:flex tw:flex-col tw:gap-1">
          <Label htmlFor="brand-token-add-value" className="tw:text-[length:var(--bk-text-12)] tw:font-normal tw:text-[var(--bk-ink-muted)]">
            Properties
          </Label>
          <TextInput
            id="brand-token-add-value"
            placeholder={PLACEHOLDER[kind] ?? "value"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            data-testid="brand-token-add-value"
          />
          {err(valErr, "brand-token-add-value-error")}
        </div>
      </div>
    </Modal>
  );
}
