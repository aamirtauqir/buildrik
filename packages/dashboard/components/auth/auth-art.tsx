/**
 * Craftwork auth art rail — the alpine illustration from the mockup, filling the
 * left column of the two-column AuthCard. Navy (#0C1830) shows through until the
 * image paints. Auth-only surface (see DESIGN.md §Auth Surface).
 */
export function AuthArt() {
  return (
    <div
      className="h-full w-full bg-[#0C1830] bg-cover bg-center"
      style={{ backgroundImage: "url(/auth/signin-art.jpg)" }}
      aria-hidden="true"
    />
  );
}
