import { useState } from "react";

export function Demo() {
  const [name, setName] = useState("");
  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input type="email" placeholder="email@example.com" />
      <input type="checkbox" checked readOnly />
    </div>
  );
}
