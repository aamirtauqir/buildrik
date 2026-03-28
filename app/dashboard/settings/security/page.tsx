import { auth } from "@/server/auth";
import { SecurityTab } from "@/components/settings/security-tab";

export default async function SecurityPage() {
  const session = await auth();
  const currentSessionId = session?.user?.dbSessionId;
  return <SecurityTab currentSessionId={currentSessionId} />;
}
