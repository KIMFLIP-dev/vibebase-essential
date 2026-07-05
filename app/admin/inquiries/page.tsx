import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getAdminInquiries } from "@/app/admin/inquiries/actions";
import { InquiriesTable } from "@/components/admin/inquiries-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { InquiryStatus } from "@/lib/types/inquiry";

interface AdminInquiriesPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

const VALID_FILTERS = ["all", "open", "answered", "closed"] as const;

async function InquiriesContent({
  statusFilter,
  page,
}: {
  statusFilter: InquiryStatus | "all";
  page: number;
}) {
  noStore();
  const result = await getAdminInquiries({ statusFilter, page });
  return <InquiriesTable result={result} statusFilter={statusFilter} />;
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default async function AdminInquiriesPage({
  searchParams,
}: AdminInquiriesPageProps) {
  const params = await searchParams;
  const statusFilter = (
    VALID_FILTERS.includes(params.status as (typeof VALID_FILTERS)[number])
      ? params.status
      : "all"
  ) as InquiryStatus | "all";
  const page = Math.max(1, Number(params.page) || 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">문의 관리</h2>
        <p className="text-sm text-muted-foreground">
          1:1 문의를 확인하고 답변합니다.
        </p>
      </div>

      <Suspense key={`${statusFilter}-${page}`} fallback={<TableSkeleton />}>
        <InquiriesContent statusFilter={statusFilter} page={page} />
      </Suspense>
    </div>
  );
}
