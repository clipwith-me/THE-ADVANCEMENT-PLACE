import type { Metadata } from "next";
import { AdminMobileBar, AdminSidebar } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/server/auth/current";
import { adminNavCounts } from "@/server/services/admin-service";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | The Advancement Place" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate for every admin page; each page and action re-checks too.
  const admin = await requireAdmin();
  const counts = await adminNavCounts(admin);
  return (
    <div className="min-h-dvh bg-ink-50">
      <AdminSidebar counts={counts} name={admin.name} />
      <AdminMobileBar counts={counts} name={admin.name} />
      <main id="main" className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
