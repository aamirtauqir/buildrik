import { IconButton } from "@/shared/ui/IconButton";
export function Demo() {
  return (
    <div>
      <IconButton
        icon={<span data-testid="ic" />}
        ariaLabel="Search"
        variant="ghost"
        size="sm"
      />
    </div>
  );
}
