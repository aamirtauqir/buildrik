import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
      <Sidebar />
      <Topbar />
      <main className="pt-14 lg:ml-[220px]">
        <div className="mx-auto max-w-[1220px] p-8">{children}</div>
      </main>
    </div>
  );
}
