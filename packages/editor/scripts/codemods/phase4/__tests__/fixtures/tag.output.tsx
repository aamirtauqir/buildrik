import { Tag } from "@/shared/ui/Tag";
import { useState } from "react";

export function Demo() {
  const [selected, setSelected] = useState(false);
  return (
    <div>
      <Tag variant="accent">marketing</Tag>
      <Tag size="sm" selectable aria-pressed={selected} onClick={() => setSelected((s) => !s)}>
        toggle
      </Tag>
    </div>
  );
}
