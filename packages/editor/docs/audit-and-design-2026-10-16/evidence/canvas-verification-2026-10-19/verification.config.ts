import base from "../../../../vitest.config";

export default {
  ...base,
  test: { ...base.test, include: ["docs/audit-and-design-2026-10-16/evidence/canvas-verification-2026-10-19/acceptance.test.tsx"] },
};
