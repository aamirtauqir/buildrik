import { Switch } from "@/shared/ui/Switch";
import { useState } from "react";

export function Demo() {
  const [on, setOn] = useState(false);
  return (
    <div>
      <Switch checked={on} onCheckedChange={setOn} />
    </div>
  );
}
