export async function createClientSession(
  sessionToken: string,
  rememberMe?: boolean,
  trustDevice?: boolean
): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken, rememberMe: rememberMe ?? false, trustDevice: trustDevice ?? false }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
