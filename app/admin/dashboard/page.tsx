import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats } from "@/app/admin/users/actions";
import { getSubscriptionPlansForChart } from "@/app/admin/pricing/actions";
import { Users, UserCheck, UserX, Activity } from "lucide-react";
import { ChartAreaInteractive } from "@/components/admin/chart-area";

async function DashboardStats() {
  noStore();
  const stats = await getDashboardStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 회원</CardTitle>
          <Users className="h-12 w-12 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">등록된 전체 회원 수</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">인증 완료</CardTitle>
          <UserCheck className="h-12 w-12 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.verified}</div>
          <p className="text-xs text-muted-foreground">이메일 인증 완료</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">미인증</CardTitle>
          <UserX className="h-12 w-12 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.unverified}</div>
          <p className="text-xs text-muted-foreground">이메일 인증 대기</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">최근 7일 접속</CardTitle>
          <Activity className="h-12 w-12 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recentLogins}</div>
          <p className="text-xs text-muted-foreground">활성 사용자</p>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function SubscriptionChart() {
  noStore();
  const plans = await getSubscriptionPlansForChart();
  return <ChartAreaInteractive plans={plans} />;
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <SubscriptionChart />
      </Suspense>
    </div>
  );
}
