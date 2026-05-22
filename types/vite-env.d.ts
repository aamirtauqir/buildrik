/**
 * Cross-package ImportMeta augmentation.
 *
 * Editor source declares vite-env.d.ts referencing vite/client, but the
 * dashboard tsconfig pulls editor files via path aliases (@/* maps to
 * ../editor/src/*) without seeing editor's d.ts. The dashboard then
 * trips on `import.meta.env.VITE_*` access in shared editor code
 * (PublishService, BuildrikSyncProvider, AssetUploadService, etc.).
 *
 * Both tsconfigs include `types/**`, so this central augmentation
 * makes ImportMeta.env visible to both worlds at type-check time.
 * Editor's vite-env.d.ts (with /// <reference types="vite/client" />)
 * still handles runtime Vite-specific helpers; this file only covers
 * the shape both worlds need.
 */

interface ImportMetaEnv {
  readonly VITE_DASHBOARD_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_FEATURE_PUBLISH?: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly MODE?: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
