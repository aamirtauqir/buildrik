import { TextInput } from "@/shared/ui/TextInput";
import { useState } from "react";

export function Demo() {
  const [name, setName] = useState("");
  return (
    <div>
      <TextInput
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <TextInput type="email" placeholder="email@example.com" />
      <input type="checkbox" checked readOnly />
    </div>
  );
}
