/**
 * D6: Starter DS gallery — 6 themed token sets shipped as compile-time
 * data. UI gallery (Phase F.1) consumes this registry. Each starter
 * passes DSLinter (no banned hues, no pure black, no missing-dark).
 *
 * Per spec DD2 + memory `feedback_axioms_against_code`: these are
 * SCAFFOLDS that ship the structure. Visual designers iterate on the
 * specific values in a follow-up "per-starter design pass" phase.
 */
import type { StarterDS } from "./types";
import { cobaltDefault } from "./cobalt-default";
import { stripeBlue } from "./stripe-blue";
import { notionWarm } from "./notion-warm";
import { appleMinimal } from "./apple-minimal";
import { linearDark } from "./linear-dark";
import { vercelMono } from "./vercel-mono";

export const STARTER_DS_REGISTRY: readonly StarterDS[] = [
  cobaltDefault,
  stripeBlue,
  notionWarm,
  appleMinimal,
  linearDark,
  vercelMono,
];

export function getStarterById(id: string): StarterDS | undefined {
  return STARTER_DS_REGISTRY.find((s) => s.id === id);
}

export type { StarterDS } from "./types";
