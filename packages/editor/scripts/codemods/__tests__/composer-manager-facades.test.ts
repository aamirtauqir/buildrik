/**
 * D3 codemod tests — Composer manager facades (Option B-tight).
 *
 * Coverage: every rename rule, the unchanged-baseline (untouched names),
 * cast unwrapping, this-vs-composer parity, idempotency, the
 * Composer.ts skip, and the test/skip-rule paths.
 *
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import jscodeshift from "jscodeshift";
import type { FileInfo, API } from "jscodeshift";
import transform, { RENAME_MAP } from "../composer-manager-facades";

function run(source: string, path = "src/editor/foo.ts"): string {
  const file: FileInfo = { path, source };
  const api: API = {
    jscodeshift: jscodeshift.withParser("tsx"),
    j: jscodeshift.withParser("tsx"),
    stats: () => {},
    report: () => {},
  };
  const out = transform(file, api, {});
  return typeof out === "string" ? out : source;
}

describe("composer-manager-facades codemod", () => {
  describe("Facade renames (cms / collab / canvas)", () => {
    it("composer.cmsManager → composer.cms.collections", () => {
      expect(run("composer.cmsManager.list();")).toBe(
        "composer.cms.collections.list();",
      );
    });

    it("composer.cmsBindings → composer.cms.bindings", () => {
      expect(run("composer.cmsBindings.bind(el);")).toBe(
        "composer.cms.bindings.bind(el);",
      );
    });

    it("composer.collaboration → composer.collab.manager", () => {
      expect(run("composer.collaboration.connect();")).toBe(
        "composer.collab.manager.connect();",
      );
    });

    it("composer.sync → composer.collab.sync", () => {
      expect(run("composer.sync.flush();")).toBe(
        "composer.collab.sync.flush();",
      );
    });

    it("composer.canvasIndicators → composer.canvas.indicators", () => {
      expect(run("composer.canvasIndicators.getOverlay();")).toBe(
        "composer.canvas.indicators.getOverlay();",
      );
    });

    it("composer.resizeHandler → composer.canvas.resize", () => {
      expect(run("composer.resizeHandler.attach(el);")).toBe(
        "composer.canvas.resize.attach(el);",
      );
    });

    it("composer.drag → composer.canvas.drag", () => {
      expect(run("composer.drag.move(p);")).toBe("composer.canvas.drag.move(p);");
    });

    it("composer.interactions → composer.canvas.interactions", () => {
      // jscodeshift preserves source-literal quote style; only re-prints
      // identifiers + member chains. Asserting on the chain part keeps the
      // test stable across recast quote-handling tweaks.
      const out = run("composer.interactions.fire('hover', el);");
      expect(out).toContain("composer.canvas.interactions.fire(");
      expect(out).toContain("'hover'");
    });
  });

  describe("Flat renames (versions / mediaOps)", () => {
    it("composer.versionHistory → composer.versions", () => {
      expect(run("composer.versionHistory.snapshot();")).toBe(
        "composer.versions.snapshot();",
      );
    });

    it("composer.mediaCommands → composer.mediaOps", () => {
      expect(run("composer.mediaCommands.insertMediaAt(src);")).toBe(
        "composer.mediaOps.insertMediaAt(src);",
      );
    });
  });

  describe("Indirect composer references", () => {
    it("this.composer.cmsManager → this.composer.cms.collections", () => {
      // Engine classes hold composer via `this.composer = composer;` and
      // dereference fields through that chain.
      expect(run("this.composer.cmsManager.bootstrap();")).toBe(
        "this.composer.cms.collections.bootstrap();",
      );
    });

    it("inst.composer.drag rewrites correctly", () => {
      expect(run("manager.composer.drag.move(p);")).toBe(
        "manager.composer.canvas.drag.move(p);",
      );
    });

    it("bare `this.cmsManager` is NOT rewritten (false-positive guard)", () => {
      // CMSBindingManager has its own `this.cmsManager` field. The
      // codemod must not rewrite bare `this.X` to avoid corrupting
      // unrelated classes that happen to share field names.
      expect(run("this.cmsManager = src;")).toBe("this.cmsManager = src;");
    });

    it("bare `this.canvasIndicators` is NOT rewritten", () => {
      expect(run("this.canvasIndicators.show();")).toBe(
        "this.canvasIndicators.show();",
      );
    });
  });

  describe("Cast unwrapping (`(composer as any).x`)", () => {
    it("rewrites through TSAsExpression cast", () => {
      const src = "(composer as any).mediaCommands.upload(file);";
      const out = run(src);
      expect(out).toContain("mediaOps.upload");
      expect(out).toContain("composer as any");
    });

    it("rewrites through nested casts", () => {
      const src = "(composer as unknown as Composer).cmsBindings.bind(el);";
      const out = run(src);
      expect(out).toContain("cms.bindings.bind");
    });
  });

  describe("Untouched (B-tight preserves hot paths)", () => {
    it("composer.history.undo() unchanged", () => {
      expect(run("composer.history.undo();")).toBe("composer.history.undo();");
    });

    it("composer.media.uploadFile() unchanged", () => {
      expect(run("composer.media.uploadFile(f);")).toBe(
        "composer.media.uploadFile(f);",
      );
    });

    it("composer.recovery.markCrash() unchanged", () => {
      expect(run("composer.recovery.markCrash();")).toBe(
        "composer.recovery.markCrash();",
      );
    });

    it("composer.elements.getAllElements() unchanged", () => {
      expect(run("composer.elements.getAllElements();")).toBe(
        "composer.elements.getAllElements();",
      );
    });

    it("composer.styles.set() unchanged (flat field stays flat)", () => {
      expect(run("composer.styles.set(id, k, v);")).toBe(
        "composer.styles.set(id, k, v);",
      );
    });
  });

  describe("Optional chaining preservation", () => {
    it("composer?.versionHistory.X preserves the leading ?.", () => {
      const out = run("composer?.versionHistory.isAvailable();");
      // First segment carries the optional → composer?.versions
      expect(out).toContain("composer?.versions");
      expect(out).not.toContain("composer.versions.isAvailable");
    });

    it("composer?.cmsManager.list() — first facade segment is optional", () => {
      const out = run("composer?.cmsManager.list();");
      // composer?.cms.collections.list() — only first segment optional
      expect(out).toContain("composer?.cms");
    });

    it("composer.cmsManager?.list() — outer optional preserved (we don't touch it)", () => {
      const out = run("composer.cmsManager?.list();");
      // The ?. is on the OUTER call (cmsManager?.list), not on cmsManager
      // itself. Replacement only touches the inner MemberExpression so the
      // outer chain stays intact.
      expect(out).toContain("composer.cms.collections?.list");
    });

    it("composer?.drag.move(p) — facade rename keeps composer ?.", () => {
      const out = run("composer?.drag.move(p);");
      expect(out).toContain("composer?.canvas");
    });
  });

  describe("Edge cases", () => {
    it("computed access (composer['cmsManager']) NOT rewritten", () => {
      // Audit-later — bracket access too rare to encode in pure-syntactic transform.
      const src = 'composer["cmsManager"].list();';
      expect(run(src)).toBe(src);
    });

    it("non-composer object NOT rewritten (e.g. foo.cmsManager)", () => {
      expect(run("foo.cmsManager.list();")).toBe("foo.cmsManager.list();");
    });

    it("nested member access works (composer.canvas.drag.move)", () => {
      // This tests the chained replacement builds correctly.
      const out = run("composer.drag.move({x:1, y:2});");
      expect(out).toBe('composer.canvas.drag.move({x:1, y:2});');
    });

    it("idempotency — running twice yields same result", () => {
      const src = "composer.cmsManager.list(); composer.drag.move(p);";
      const once = run(src);
      const twice = run(once);
      expect(twice).toBe(once);
    });
  });

  describe("Skip rules", () => {
    it("Composer.ts itself is skipped", () => {
      const src = "this.cmsManager = new CollectionManager();";
      expect(run(src, "src/engine/Composer.ts")).toBe(src);
    });

    it("__tests__ paths skipped", () => {
      const src = "composer.drag.move(p);";
      expect(run(src, "src/editor/canvas/__tests__/foo.test.ts")).toBe(src);
    });

    it("scripts/ paths skipped", () => {
      // skip-rule matches "/scripts/" substring (leading slash required —
      // mirrors the real-codemod absolute-path inputs).
      const src = "composer.drag.move(p);";
      expect(run(src, "packages/editor/scripts/migrate-something.ts")).toBe(src);
    });

    it("preview/ paths skipped", () => {
      const src = "composer.drag.move(p);";
      expect(run(src, "src/preview/vibcoder-x.tsx")).toBe(src);
    });
  });

  describe("Mapping table sanity", () => {
    it("RENAME_MAP covers exactly 10 source names (B-tight scope)", () => {
      expect(Object.keys(RENAME_MAP)).toHaveLength(10);
    });

    it("RENAME_MAP has no overlap with kept-flat names", () => {
      const keptFlat = [
        "elements",
        "styles",
        "commands",
        "selection",
        "history",
        "media",
        "data",
        "globalStyles",
        "styleBindings",
        "traitBindings",
        "textBindings",
        "templates",
        "fonts",
        "components",
        "viewport",
        "plugins",
        "storage",
        "forms",
        "router",
        "recovery",
      ];
      for (const name of keptFlat) {
        expect(RENAME_MAP[name]).toBeUndefined();
      }
    });
  });
});
