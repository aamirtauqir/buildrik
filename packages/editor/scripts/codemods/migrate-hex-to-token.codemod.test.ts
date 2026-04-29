import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { migrateHexToToken } from "./migrate-hex-to-token";

describe("migrate-hex-to-token codemod", () => {
  it("transforms input fixture to match output fixture", () => {
    const input = readFileSync(
      resolve(__dirname, "./__fixtures__/hex-to-token.input.tsx"),
      "utf-8",
    );
    const expected = readFileSync(
      resolve(__dirname, "./__fixtures__/hex-to-token.output.tsx"),
      "utf-8",
    );
    const result = migrateHexToToken(input);
    expect(result.trim()).toEqual(expected.trim());
  });
});
