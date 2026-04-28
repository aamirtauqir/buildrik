import { describe, it, expect } from "vitest";
import { OTEngine } from "../OTEngine";

describe("OTEngine transform fast paths", () => {
  it("skips local replace when remote replace targets exact path", () => {
    const engine = new OTEngine({} as any);
    const patchA = [{ op: "replace", path: "/a/b", value: "remote" }];
    const patchB = [{ op: "replace", path: "/a/b", value: "local" }];
    const result = engine.transform(patchA, patchB);
    expect(result.bPrime).toHaveLength(0);
  });

  it("skips local add when remote add targets exact path", () => {
    const engine = new OTEngine({} as any);
    const patchA = [{ op: "add", path: "/a/b", value: "remote" }];
    const patchB = [{ op: "add", path: "/a/b", value: "local" }];
    const result = engine.transform(patchA, patchB);
    expect(result.bPrime).toHaveLength(0);
  });
});
