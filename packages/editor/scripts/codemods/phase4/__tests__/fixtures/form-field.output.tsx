import { FormField } from "@/shared/ui/FormField";
export function Demo() {
  return (
    <div>
      <FormField label="Name" required>
        <input type="text" />
      </FormField>
    </div>
  );
}
