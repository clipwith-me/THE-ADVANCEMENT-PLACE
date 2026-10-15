import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JobForm } from "@/components/admin/job-form";
import { PageHeader } from "@/components/ui/misc";
import { requireAdmin } from "@/server/auth/current";
import { listCategories } from "@/server/services/job-service";
import { createJobAction } from "../../../actions";

export const metadata = { title: "New job" };

export default async function NewJobPage() {
  await requireAdmin();
  const categories = await listCategories();
  return (
    <>
      <Link href="/admin/jobs" className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft aria-hidden className="size-4" /> Jobs
      </Link>
      <PageHeader title="New job" description="Fields marked * are required. Save as a draft to preview before publishing." />
      <JobForm action={createJobAction} categories={categories} mode="create" />
    </>
  );
}
