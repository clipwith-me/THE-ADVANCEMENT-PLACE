import { ShieldX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Access denied", robots: { index: false } };

export default function AccessDeniedPage() {
  return (
    <div className="container-page py-20 text-center sm:py-28">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-danger-50 text-danger-700">
        <ShieldX aria-hidden className="size-7" />
      </span>
      <p className="mt-6 text-sm font-semibold text-danger-700">403</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">You don&apos;t have access to this page</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-600">
        This area is restricted. If you believe you should have access, please contact the site administrator.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/account">Go to my dashboard</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Homepage
        </ButtonLink>
      </div>
    </div>
  );
}
