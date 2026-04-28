import { Stack } from "@/editor/shared/vibcoder";

export function NestedSection({ children }: { children: React.ReactNode }) {
  return (
    <Stack>
      <h2>Title</h2>
      <Stack gap="xs">
        {children}
      </Stack>
    </Stack>
  );
}
