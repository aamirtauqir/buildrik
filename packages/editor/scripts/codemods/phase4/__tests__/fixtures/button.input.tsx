import { useState } from "react";

export function Demo() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Click</button>
      <button disabled>Disabled</button>
    </div>
  );
}
