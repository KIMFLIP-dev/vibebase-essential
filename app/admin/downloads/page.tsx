import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { getAdminDownloads } from "./actions";
import { DownloadsTable } from "@/components/admin/downloads-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Eye, Plus, BarChart3, CreditCard } from "lucide-react";

async function DownloadsContent() {
  noStore();
  const items = await getAdminDownloads();

  const total = items.length;
  const published = items.filter((i) => i.is_published).length;
  const totalDownloads = items.reduce((sum, i) => sum + (i.download_count ?? 0), 0);
  const paid = items.filter((i) => i.is_paid).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 카드</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">공개 카드</p>
                <p className="text-2xl font-bold">{published}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 다운로드</p>
                <p className="text-2xl font-bold">{totalDownloads.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">유료 카드</p>
                <p className="text-2xl font-bold">{paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DownloadsTable items={items} />
    </div>
  );
}

function DownloadsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default async function AdminDownloadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground flex items-center whitespace-nowrap">
            <Download className="h-5 w-5 mr-2 flex-shrink-0" /> /download 페이지의 다운로드 카드를 관리합니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/downloads/new">
            <Plus className="h-4 w-4 mr-2" />새 다운로드 추가
          </Link>
        </Button>
      </div>

      <Suspense fallback={<DownloadsSkeleton />}>
        <DownloadsContent />
      </Suspense>
    </div>
  );
}
