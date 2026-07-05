import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getCoursePurchases, getCoursePurchaseStats } from "./actions";
import { CoursePurchasesTable } from "@/components/admin/course-purchases-table";
import { PurchaseSearch } from "@/components/admin/purchase-search";
import { PurchasePagination } from "@/components/admin/purchase-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, CheckCircle, RotateCcw } from "lucide-react";

async function CoursePurchaseStats() {
  noStore();
  const stats = await getCoursePurchaseStats();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 코스 구매</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
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

async function CoursePurchasesTableContent({ search, page }: { search?: string; page: number }) {
  noStore();
  const result = await getCoursePurchases(page, PER_PAGE, search);
  const totalPages = Math.ceil(result.total / PER_PAGE);

  return (
    <div className="space-y-4">
      <CoursePurchasesTable purchases={result.purchases} />
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

export default async function AdminCoursePurchasesPage({ searchParams }: PageProps) {
  const { search, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-foreground flex items-center">
          <GraduationCap className="h-5 w-5 mr-2 flex-shrink-0" />
          코스 결제 현황 및 구매 기록을 관리합니다.
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <CoursePurchaseStats />
      </Suspense>

      <PurchaseSearch defaultValue={search} />

      <Suspense fallback={<TableSkeleton />} key={`${search}-${page}`}>
        <CoursePurchasesTableContent search={search} page={page} />
      </Suspense>
    </div>
  );
}
