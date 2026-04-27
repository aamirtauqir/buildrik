import { SliderInput } from "@/shared/ui/SliderInput";
import { useState } from "react";

export function Demo() {
  const [v, setV] = useState(0);
  return (
    <div>
      <SliderInput value={v} onChange={setV} min={0} max={100} step={1} unit="%" label="Opacity" />
    </div>
  );
}
