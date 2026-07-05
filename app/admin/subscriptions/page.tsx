import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getSubscriptions, getSubscriptionStats } from "./actions";
import { SubscriptionsTable } from "@/components/admin/subscriptions-table";
import { SubscriptionSearch } from "@/components/admin/subscription-search";
import { SubscriptionPagination } from "@/components/admin/subscription-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, Users, XCircle, CalendarX, Info } from "lucide-react";

async function SubscriptionStats() {
  noStore();
  const stats = await getSubscriptionStats();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 구독</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">활성 구독</CardTitle>
          <Users className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">취소 예정</CardTitle>
          <CalendarX className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.scheduled_cancel}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">취소됨</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.canceled}</div>
        </CardContent>
      </Card>
    </div>
  );
}

const PER_PAGE = 10;

async function SubscriptionsTableContent({ search, page }: { search?: string; page: number }) {
  noStore();
  const result = await getSubscriptions(page, PER_PAGE, undefined, search);
  const totalPages = Math.ceil(result.total / PER_PAGE);

  return (
    <div className="space-y-4">
      <SubscriptionsTable subscriptions={result.subscriptions} />
      <SubscriptionPagination
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
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
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

export default async function AdminSubscriptionsPage({ searchParams }: PageProps) {
  const { search, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-foreground flex items-center">
          <CreditCard className="h-5 w-5 mr-2 flex-shrink-0" />
          구독 현황 및 결제 기록을 관리합니다.
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <SubscriptionStats />
      </Suspense>

      <SubscriptionSearch defaultValue={search} />

      <Suspense fallback={<TableSkeleton />} key={`${search}-${page}`}>
        <SubscriptionsTableContent search={search} page={page} />
      </Suspense>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>환불 처리 안내</AlertTitle>
        <AlertDescription>
          Creem은 환불 API를 지원하지 않습니다. 환불이 필요한 경우 Creem 대시보드에서 직접 환불 처리한 후,
          구독 목록에서 &quot;Creem 동기화&quot; 버튼을 클릭하여 환불 정보를 동기화하세요.
        </AlertDescription>
      </Alert>
    </div>
  );
}
