import { Spinner } from "@/shared/ui/Spinner";
export function Demo({ loading }: { loading: boolean }) {
  return (
    <div>
      {loading && <Spinner size="sm" />}
      <Spinner size="lg" color="currentColor" />
    </div>
  );
}
