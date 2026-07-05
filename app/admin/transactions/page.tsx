import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getTransactions, getTransactionStats } from "./actions";
import { TransactionsTable } from "@/components/admin/transactions-table";
import { TransactionSearch } from "@/components/admin/transaction-search";
import { TransactionPagination } from "@/components/admin/transaction-pagination";
import { TransactionSync } from "@/components/admin/transaction-sync";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, CheckCircle, XCircle, RotateCcw } from "lucide-react";

async function TransactionStats() {
  noStore();
  const stats = await getTransactionStats();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 결제</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">성공</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.succeeded}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">환불</CardTitle>
          <RotateCcw className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.refunded}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">실패</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
        </CardContent>
      </Card>
    </div>
  );
}

const PER_PAGE = 10;

async function TransactionsTableContent({ search, page }: { search?: string; page: number }) {
  noStore();
  const result = await getTransactions(page, PER_PAGE, undefined, search);
  const totalPages = Math.ceil(result.total / PER_PAGE);

  return (
    <div className="space-y-4">
      <TransactionsTable transactions={result.transactions} />
      <TransactionPagination
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

export default async function AdminTransactionsPage({ searchParams }: PageProps) {
  const { search, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-foreground flex items-center">
          <Receipt className="h-5 w-5 mr-2 flex-shrink-0" />
          결제 내역 및 트랜잭션을 관리합니다.
        </p>
        <TransactionSync />
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <TransactionStats />
      </Suspense>

      <TransactionSearch defaultValue={search} />

      <Suspense fallback={<TableSkeleton />} key={`${search}-${page}`}>
        <TransactionsTableContent search={search} page={page} />
      </Suspense>
    </div>
  );
}
