import { useState } from "react";

export function Demo() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  return (
    <div>
      <input type="checkbox" checked={a} onChange={(e) => setA(e.target.checked)} />
      <Checkbox checked={b} onChange={(e) => setB(e.target.checked)} />
      <input type="text" placeholder="other" />
    </div>
  );
}
