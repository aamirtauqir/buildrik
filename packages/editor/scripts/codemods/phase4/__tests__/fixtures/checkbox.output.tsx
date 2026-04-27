import { Checkbox } from "@/shared/ui/Checkbox";
import { useState } from "react";

export function Demo() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(false);
  return (
    <div>
      <Checkbox checked={a} onChange={(e) => setA(e.target.checked)} />
      <Checkbox checked={b} onChange={(e) => setB(e.target.checked)} />
      <input type="text" placeholder="other" />
    </div>
  );
}
