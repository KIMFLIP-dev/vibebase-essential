import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getPurchases, getPurchaseStats } from "./actions";
import { PurchasesTable } from "@/components/admin/purchases-table";
import { PurchaseSearch } from "@/components/admin/purchase-search";
import { PurchasePagination } from "@/components/admin/purchase-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShoppingBag, CheckCircle, RotateCcw, Info } from "lucide-react";

async function PurchaseStats() {
  noStore();
  const stats = await getPurchaseStats();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 구매</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">완료</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">환불</CardTitle>
          <RotateCcw className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.refunded}</div>
        </CardContent>
      </Card>
    </div>
  );
}

const PER_PAGE = 10;

async function PurchasesTableContent({ search, page }: { search?: string; page: number }) {
  noStore();
  const result = await getPurchases(page, PER_PAGE, undefined, search);
  const totalPages = Math.ceil(result.total / PER_PAGE);

  return (
    <div className="space-y-4">
      <PurchasesTable purchases={result.purchases} />
      <PurchasePagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={result.total}
        perPage={PER_PAGE}
      />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return <Skeleton className="h-96 w-full" />;
}

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminPurchasesPage({ searchParams }: PageProps) {
  const { search, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-foreground flex items-center">
          <ShoppingBag className="h-5 w-5 mr-2 flex-shrink-0" />
          단건 결제 현황 및 구매 기록을 관리합니다.
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <PurchaseStats />
      </Suspense>

      <PurchaseSearch defaultValue={search} />

      <Suspense fallback={<TableSkeleton />} key={`${search}-${page}`}>
        <PurchasesTableContent search={search} page={page} />
      </Suspense>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>환불 처리 안내</AlertTitle>
        <AlertDescription>
          Creem은 환불 API를 지원하지 않습니다. 환불이 필요한 경우 Creem 대시보드에서 직접 환불 처리한 후,
          구매 목록에서 &quot;Creem 동기화&quot; 버튼을 클릭하여 환불 정보를 동기화하세요.
        </AlertDescription>
      </Alert>
    </div>
  );
}
