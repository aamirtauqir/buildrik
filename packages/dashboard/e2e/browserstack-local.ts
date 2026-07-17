import { Local } from "browserstack-local";

// Cloud browsers can't reach localhost directly, so open a BrowserStack Local
// tunnel before the cloud run and close it after. No-op when creds are absent
// (local runs never call this — it's wired as globalSetup only when isBS).
export default async function globalSetup() {
  const key = process.env.BROWSERSTACK_ACCESS_KEY;
  if (!key) return;

  const bsLocal = new Local();
  await new Promise<void>((resolve, reject) => {
    bsLocal.start({ key, force: "true", forceLocal: "true" }, (err?: Error) =>
      err ? reject(err) : resolve(),
    );
  });

  // Playwright calls the returned function as global teardown.
  return async () => {
    await new Promise<void>((resolve) => bsLocal.stop(() => resolve()));
  };
}
