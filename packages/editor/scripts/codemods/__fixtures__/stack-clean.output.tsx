import { Stack } from "@/editor/shared/vibcoder";

export function PanelBody({ children }: { children: React.ReactNode }) {
  return (
    <Stack gap="sm">
      {children}
    </Stack>
  );
}
