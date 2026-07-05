"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RefreshCw, Download } from "lucide-react";
import { syncPurchaseWithCreem } from "@/app/admin/purchases/actions";
import type { Purchase, PurchaseStatus } from "@/lib/types/admin";
import { toast } from "sonner";

interface Props {
  purchases: Purchase[];
}

function getStatusBadge(status: PurchaseStatus, isRefunded: boolean) {
  if (isRefunded) {
    return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">환불됨</Badge>;
  }

  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-600">완료</Badge>;
    case "refunded":
      return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">환불됨</Badge>;
    case "failed":
      return <Badge variant="destructive">실패</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function PurchasesTable({ purchases }: Props) {
  const router = useRouter();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSync = async (purchase: Purchase) => {
    setSyncingId(purchase.id);
    try {
      const result = await syncPurchaseWithCreem(purchase.id);
      if (result.success) {
        const currentIsRefunded = purchase.is_refunded ?? false;
        const refundChanged = result.isRefunded !== currentIsRefunded;

        if (refundChanged && result.isRefunded) {
          toast.success(`동기화 완료: 환불 ${formatCurrency(result.refundedAmount || 0, purchase.currency)}`);
          router.refresh();
        } else {
          toast.info("이미 최신 상태입니다.");
        }
      } else {
        toast.error(result.error || "동기화에 실패했습니다.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "동기화에 실패했습니다.");
    } finally {
      setSyncingId(null);
    }
  };

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        아직 구매 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>사용자</TableHead>
            <TableHead>상품명</TableHead>
            <TableHead>금액</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>환불</TableHead>
            <TableHead>다운로드</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>일시</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {purchase.user?.email || "-"}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {purchase.creem_customer_id || "-"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {purchase.plan?.name || "-"}
              </TableCell>
              <TableCell>
                {formatCurrency(purchase.amount, purchase.currency)}
              </TableCell>
              <TableCell>
                {getStatusBadge(purchase.status, purchase.is_refunded)}
              </TableCell>
              <TableCell>
                {syncingId === purchase.id ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">확인 중...</span>
                  </div>
                ) : purchase.is_refunded ? (
                  <Badge variant="outline" className="bg-white border-red-300 text-red-600 dark:bg-red-950 dark:border-red-700 dark:text-red-400">
                    {formatCurrency(purchase.refunded_amount, purchase.currency)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {purchase.plan?.download_url ? (
                  <a
                    href={purchase.plan.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-xs">링크</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs font-mono text-muted-foreground">
                  {purchase.creem_order_id || "-"}
                </span>
              </TableCell>
              <TableCell>
                {formatDate(purchase.created_at)}
              </TableCell>
              <TableCell>
                {purchase.creem_order_id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={syncingId === purchase.id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleSync(purchase)}
                        disabled={syncingId === purchase.id}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${syncingId === purchase.id ? "animate-spin" : ""}`} />
                        {syncingId === purchase.id ? "확인 중..." : "Creem 동기화"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
