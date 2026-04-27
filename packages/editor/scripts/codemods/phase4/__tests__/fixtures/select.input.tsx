import { useState } from "react";

export function Demo() {
  const [v, setV] = useState("a");
  return (
    <div>
      <select value={v} onChange={(e) => setV(e.target.value)}>
        <option value="a">A</option>
        <option value="b">B</option>
      </select>
    </div>
  );
}
