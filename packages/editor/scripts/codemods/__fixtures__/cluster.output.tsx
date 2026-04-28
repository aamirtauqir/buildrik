import { Cluster } from "@/editor/shared/vibcoder";

export function TagRow({ tags }: { tags: string[] }) {
  return (
    <Cluster gap="xs">
      {tags.map((t) => <span key={t}>{t}</span>)}
    </Cluster>
  );
}
