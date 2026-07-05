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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, XCircle, RefreshCw } from "lucide-react";
import { updateSubscriptionStatus, syncSubscriptionWithCreem } from "@/app/admin/subscriptions/actions";
import type { Subscription, SubscriptionStatus } from "@/lib/types/admin";
import { toast } from "sonner";

interface Props {
  subscriptions: Subscription[];
}

function getDaysText(currentPeriodEnd: string | null): string {
  if (!currentPeriodEnd) return "";
  const end = new Date(currentPeriodEnd);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays}일 남음`;
  } else if (diffDays === 0) {
    return "오늘 만료";
  } else {
    return `${Math.abs(diffDays)}일 전`;
  }
}

function getStatusBadge(status: SubscriptionStatus, currentPeriodEnd: string | null) {
  const isExpired = currentPeriodEnd && new Date(currentPeriodEnd) <= new Date();
  const daysText = getDaysText(currentPeriodEnd);

  switch (status) {
    case "active":
      return <Badge variant="default" className="bg-green-600">활성</Badge>;
    case "scheduled_cancel":
      return isExpired
        ? <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">만료 ({daysText})</Badge>
        : <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">취소 예정 ({daysText})</Badge>;
    case "canceled":
      return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">취소됨</Badge>;
    case "unpaid":
      return <Badge variant="destructive">연체</Badge>;
    case "trialing":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">체험중</Badge>;
    case "paused":
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">일시정지</Badge>;
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
  });
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function SubscriptionsTable({ subscriptions }: Props) {
  const router = useRouter();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleCancelClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedSubscription) return;

    setIsProcessing(true);
    try {
      await updateSubscriptionStatus(selectedSubscription.id, "canceled");
      toast.success("구독이 취소되었습니다.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "구독 취소에 실패했습니다.");
    } finally {
      setIsProcessing(false);
      setCancelDialogOpen(false);
      setSelectedSubscription(null);
    }
  };

  const handleSync = async (subscription: Subscription) => {
    setSyncingId(subscription.id);
    try {
      const result = await syncSubscriptionWithCreem(subscription.id);
      if (result.success) {
        const statusChanged = result.newStatus !== subscription.status;
        const currentIsRefunded = subscription.is_refunded ?? false;
        const refundChanged = result.isRefunded !== currentIsRefunded;

        if (statusChanged || refundChanged) {
          const messages: string[] = [];
          if (statusChanged) {
            messages.push(`상태: ${result.newStatus}`);
          }
          if (refundChanged && result.isRefunded) {
            messages.push(`환불: ${formatCurrency(result.refundedAmount || 0, subscription.currency)}`);
          }
          toast.success(`동기화 완료: ${messages.join(", ")}`);
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

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        아직 구독 기록이 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사용자</TableHead>
              <TableHead>플랜</TableHead>
              <TableHead>결제 주기</TableHead>
              <TableHead>금액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>환불</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>시작일</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {subscription.user?.email || "-"}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {subscription.creem_customer_id || "-"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {subscription.plan?.name || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {subscription.billing_period === "yearly" ? "연간" : "월간"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatCurrency(subscription.amount, subscription.currency)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(subscription.status, subscription.current_period_end)}
                </TableCell>
                <TableCell>
                  {syncingId === subscription.id ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">확인 중...</span>
                    </div>
                  ) : subscription.is_refunded ? (
                    <Badge variant="outline" className="bg-white border-red-300 text-red-600 dark:bg-red-950 dark:border-red-700 dark:text-red-400">
                      {formatCurrency(subscription.refunded_amount, subscription.currency)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono text-muted-foreground">
                    {subscription.creem_order_id || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  {formatDate(subscription.created_at)}
                </TableCell>
                <TableCell>
                  {subscription.creem_subscription_id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isProcessing}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleSync(subscription)}
                          disabled={syncingId === subscription.id}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncingId === subscription.id ? "animate-spin" : ""}`} />
                          {syncingId === subscription.id ? "확인 중..." : "Creem 동기화"}
                        </DropdownMenuItem>
                        {(subscription.status === "active" || subscription.status === "scheduled_cancel") && (
                          <DropdownMenuItem
                            onClick={() => handleCancelClick(subscription)}
                            className="text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {subscription.status === "scheduled_cancel" ? "즉시 취소" : "구독 취소"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>구독을 취소하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {selectedSubscription?.user?.email}님의 {selectedSubscription?.plan?.name} 구독을 취소합니다.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>1순위:</strong> 고객에게 직접 취소를 안내하세요.
                    사용자 페이지(내 구독)에서 고객이 직접 구독을 취소할 수 있습니다.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>2순위:</strong> Creem 대시보드에서 환불 처리를 통해 취소하세요.
                    환불 시 구독이 자동으로 취소되며 고객도 환불받을 수 있습니다.
                  </p>
                </div>
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
                  <p className="text-destructive font-semibold flex items-center gap-2">
                    <span className="text-lg">⚠️</span> 관리자 취소는 권장하지 않습니다
                  </p>
                  <ul className="text-sm text-destructive/90 space-y-1 ml-6 list-disc">
                    <li>여기서 취소해도 <strong>환불이 자동으로 처리되지 않습니다</strong></li>
                    <li>취소만 되고 고객은 결제한 금액을 돌려받지 못합니다</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>닫기</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "처리 중..." : "그래도 취소"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
