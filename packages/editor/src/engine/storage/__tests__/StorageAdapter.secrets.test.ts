/**
 * StorageAdapter — browser-storage secret redaction.
 *
 * localStorage/sessionStorage are readable by any XSS or anyone on a shared
 * device. Genuine secrets (email integration API key, published-site password)
 * must not be persisted there. The dashboard sync path receives data straight
 * from exportProject() (not the browser-storage copy), so redaction must NOT
 * mutate the passed-in object — only the serialized browser copy.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { StorageAdapter } from "../StorageAdapter";
import type { Composer } from "../../Composer";
import type { ProjectData, ProjectSettings } from "../../../shared/types";

function makeAdapter(keyPrefix: string) {
  // autoSave:false → constructor never touches the composer, so a bare stub is safe.
  return new StorageAdapter({} as unknown as Composer, {
    type: "local",
    keyPrefix,
    autoSave: false,
  });
}

function projectWithSecrets(): ProjectData {
  const settings: ProjectSettings = {
    integrations: {
      email: { provider: "resend", enabled: true, apiKey: "re_secret_123", listId: "L1" },
      stripe: { enabled: true, publishableKey: "pk_live_abc", checkoutMode: "payment-links" },
    },
    publishing: { provider: "vercel", publishedPassword: "hunter2" },
    customCode: { headScripts: "<script>analytics()</script>", bodyScripts: "", globalCss: "" },
  };
  return { version: "1.0.0", pages: [], styles: [], assets: [], settings };
}

describe("StorageAdapter — browser-storage secret redaction", () => {
  beforeEach(() => localStorage.clear());

  it("strips email.apiKey and publishedPassword from the localStorage copy", async () => {
    const adapter = makeAdapter("test-secrets");
    await adapter.save(projectWithSecrets());

    const parsed = JSON.parse(localStorage.getItem("test-secrets-project")!);
    expect(parsed.settings.integrations.email.apiKey).toBeUndefined();
    expect(parsed.settings.publishing.publishedPassword).toBeNull();
  });

  it("keeps non-secret settings in the localStorage copy", async () => {
    const adapter = makeAdapter("test-keep");
    await adapter.save(projectWithSecrets());

    const parsed = JSON.parse(localStorage.getItem("test-keep-project")!);
    // publishable key is public by design; email provider/listId and custom code are not secrets
    expect(parsed.settings.integrations.email.provider).toBe("resend");
    expect(parsed.settings.integrations.email.listId).toBe("L1");
    expect(parsed.settings.integrations.stripe.publishableKey).toBe("pk_live_abc");
    expect(parsed.settings.customCode.headScripts).toContain("analytics");
  });

  it("does not mutate the passed-in object (server sync still gets the secrets)", async () => {
    const adapter = makeAdapter("test-nomutate");
    const data = projectWithSecrets();
    await adapter.save(data);

    expect(data.settings!.integrations!.email!.apiKey).toBe("re_secret_123");
    expect(data.settings!.publishing!.publishedPassword).toBe("hunter2");
  });
});
