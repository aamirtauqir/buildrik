import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../explode-shared-ui-barrel";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("explode-shared-ui-barrel codemod", () => {
  it("explodes a barrel with multiple names", () => {
    const before = `import { Modal, Button, Spinner } from "../shared/ui";`;
    const after = `import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Spinner } from "@/shared/ui/Spinner";`;
    expect(runCodemod(transform, FAKE_PATH, before).trim()).toBe(after.trim());
  });

  it("handles relative path variations (../shared/ui, ../../shared/ui, etc.)", () => {
    const before1 = `import { Button } from "../shared/ui";`;
    const before2 = `import { Button } from "../../shared/ui";`;
    const before3 = `import { Button } from "../../../shared/ui";`;
    const expected = `import { Button } from "@/shared/ui/Button";`;
    expect(runCodemod(transform, FAKE_PATH, before1).trim()).toBe(expected);
    expect(runCodemod(transform, FAKE_PATH, before2).trim()).toBe(expected);
    expect(runCodemod(transform, FAKE_PATH, before3).trim()).toBe(expected);
  });

  it("preserves type-only imports", () => {
    const before = `import { Button, type ButtonProps } from "../shared/ui";`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain('import { Button } from "@/shared/ui/Button"');
    expect(result).toContain('import { type ButtonProps } from "@/shared/ui/Button"');
  });

  it("does NOT touch deeper subpath imports (already direct)", () => {
    const before = `import { Tag } from "@/shared/ui/Tag";`;
    expect(runCodemod(transform, FAKE_PATH, before).trim()).toBe(before);
  });

  it("does NOT touch the barrel file itself", () => {
    // The barrel index.tsx is its own thing; codemod should skip when path matches.
    const before = `import { Button } from "./Button";`;
    expect(runCodemod(transform, "/fake/src/shared/ui/index.tsx", before).trim()).toBe(before);
  });

  it("respects shouldSkipPath — does not touch __tests__/ paths", () => {
    const before = `import { Button } from "../shared/ui";`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result.trim()).toBe(before);
  });

  it("is idempotent — running twice produces same result", () => {
    const before = `import { Modal, Button } from "../shared/ui";`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });

  it("preserves aliases — `import { Button as Btn } from \"../shared/ui\"` works", () => {
    const before = `import { Button as Btn } from "../shared/ui";`;
    const expected = `import { Button as Btn } from "@/shared/ui/Button";`;
    expect(runCodemod(transform, FAKE_PATH, before).trim()).toBe(expected);
  });
});
