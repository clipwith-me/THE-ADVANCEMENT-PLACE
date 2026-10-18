import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";
import { requireCandidate } from "@/server/auth/current";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCandidate();
  return (
    <div className="bg-ink-50/60">
      <div className="container-page grid grid-cols-1 gap-6 py-6 sm:py-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <AccountNav name={user.name} email={user.email} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
