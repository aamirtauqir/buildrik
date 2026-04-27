import { Badge } from "@/shared/ui/Badge";
export function Demo({ count }: { count: number }) {
  return (
    <div>
      <Badge variant="primary" size="sm">
        New
      </Badge>
      <Badge variant="default">{count}</Badge>
    </div>
  );
}
