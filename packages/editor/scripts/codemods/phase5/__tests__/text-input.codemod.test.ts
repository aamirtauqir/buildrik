import { describe, it, expect } from "vitest";
import { runCodemod } from "../../_lib/__tests__/test-helpers";
import transform from "../text-input";

const FAKE_PATH = "/fake/src/editor/Demo.tsx";

describe("phase5/text-input codemod — TextInput → Input migration", () => {
  it("rewrites import path AND identifier", () => {
    const before = `import { TextInput } from "@/shared/ui/TextInput";\nexport const X = () => <TextInput value="x" />;`;
    const after = `import { Input } from "@/editor/shared/vibcoder/Input";\nexport const X = () => <Input value="x" />;`;
    expect(runCodemod(transform, FAKE_PATH, before).trim()).toBe(after.trim());
  });

  it("rewrites JSX self-closing tag", () => {
    const before = `import { TextInput } from "@/shared/ui/TextInput";\n<TextInput />;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain("<Input />");
    expect(result).not.toContain("<TextInput");
  });

  it("rewrites JSX paired open/close tags", () => {
    const before = `import { TextInput } from "@/shared/ui/TextInput";\n<TextInput><span/></TextInput>`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain("<Input>");
    expect(result).toContain("</Input>");
    expect(result).not.toContain("TextInput");
  });

  it("renames invalid prop → error", () => {
    const before = `import { TextInput } from "@/shared/ui/TextInput";\n<TextInput invalid={true} />;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain("error={true}");
    expect(result).not.toContain("invalid=");
  });

  it("drops inputSize prop entirely", () => {
    const before = `import { TextInput } from "@/shared/ui/TextInput";\n<TextInput inputSize="sm" value="x" />;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).not.toContain("inputSize");
    expect(result).toContain("value=\"x\"");
  });

  it("preserves type-only imports — TextInputProps → InputProps", () => {
    const before = `import { TextInput, type TextInputProps } from "@/shared/ui/TextInput";\nconst x: TextInputProps = {};`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain('import { Input, type InputProps } from "@/editor/shared/vibcoder/Input"');
    expect(result).toContain("const x: InputProps");
  });

  it("preserves other props (placeholder, value, onChange, disabled)", () => {
    const before = `import { TextInput } from "@/shared/ui/TextInput";\n<TextInput placeholder="x" value={v} onChange={fn} disabled />;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain('placeholder="x"');
    expect(result).toContain("value={v}");
    expect(result).toContain("onChange={fn}");
    expect(result).toContain("disabled");
  });

  it("handles relative path imports", () => {
    const before = `import { TextInput } from "../shared/ui/TextInput";\n<TextInput />;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain('from "@/editor/shared/vibcoder/Input"');
  });

  it("does NOT touch unrelated imports", () => {
    const before = `import { Button } from "@/shared/ui/Button";\nimport { TextInput } from "@/shared/ui/TextInput";\n<Button/>;<TextInput/>;`;
    const result = runCodemod(transform, FAKE_PATH, before);
    expect(result).toContain('import { Button } from "@/shared/ui/Button"');  // untouched
    expect(result).toContain('import { Input } from "@/editor/shared/vibcoder/Input"');
  });

  it("respects shouldSkipPath", () => {
    const before = `import { TextInput } from "@/shared/ui/TextInput";\n<TextInput />;`;
    const result = runCodemod(transform, "/fake/src/editor/__tests__/Foo.test.tsx", before);
    expect(result.trim()).toBe(before);
  });

  it("is idempotent", () => {
    const before = `import { TextInput } from "@/shared/ui/TextInput";\n<TextInput invalid />`;
    const once = runCodemod(transform, FAKE_PATH, before);
    const twice = runCodemod(transform, FAKE_PATH, once);
    expect(twice).toBe(once);
  });
});
