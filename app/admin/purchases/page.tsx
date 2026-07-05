import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getAdminPurchases } from "@/app/admin/purchases/actions";
import { PurchasesTable } from "@/components/admin/purchases-table";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminPurchasesPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

async function PurchasesContent({
  page,
  search,
}: {
  page: number;
  search: string;
}) {
  noStore();
  const result = await getAdminPurchases({ page, search });
  return <PurchasesTable result={result} search={search} />;
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

export default async function AdminPurchasesPage({
  searchParams,
}: AdminPurchasesPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.search ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">구매 내역</h2>
        <p className="text-sm text-muted-foreground">
          상품 구매 내역을 조회하고 환불을 처리합니다.
        </p>
      </div>

      <Suspense key={`${page}-${search}`} fallback={<TableSkeleton />}>
        <PurchasesContent page={page} search={search} />
      </Suspense>
    </div>
  );
}
