import { Select } from "@/shared/ui/Select";
import { useState } from "react";

export function Demo() {
  const [v, setV] = useState("a");
  return (
    <div>
      <Select value={v} onChange={(e) => setV(e.target.value)}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    </div>
  );
}
