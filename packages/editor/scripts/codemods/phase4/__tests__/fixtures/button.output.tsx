import { Button } from "@/shared/ui/Button";
import { useState } from "react";

export function Demo() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <Button onClick={() => setCount(count + 1)}>Click</Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}
