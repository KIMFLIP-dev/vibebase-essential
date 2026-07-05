"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { refundPurchase, type PurchasesListResult } from "@/app/admin/purchases/actions";
import type { ProductPurchase } from "@/lib/types/product";

interface PurchasesTableProps {
  result: PurchasesListResult;
  search: string;
}

function statusBadge(purchase: ProductPurchase) {
  if (purchase.is_refunded || purchase.status === "refunded") {
    return <Badge variant="destructive">환불됨</Badge>;
  }
  if (purchase.status === "completed") {
    return <Badge>완료</Badge>;
  }
  return <Badge variant="secondary">{purchase.status}</Badge>;
}

export function PurchasesTable({ result, search }: PurchasesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(search);
  const [refundTarget, setRefundTarget] = useState<ProductPurchase | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

  const navigate = (page: number, searchValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue) params.set("search", searchValue);
    else params.delete("search");
    if (page > 1) params.set("page", String(page));
    else params.delete("page");
    router.push(`/admin/purchases?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(1, searchInput);
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    setIsRefunding(true);
    try {
      const res = await refundPurchase(refundTarget.id, refundReason);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("환불이 완료되었습니다.");
      setRefundTarget(null);
      setRefundReason("");
      router.refresh();
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <Input
          placeholder="주문번호 · 상품명 · 결제ID 검색"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button type="submit" variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>상품</TableHead>
              <TableHead>구매자</TableHead>
              <TableHead>금액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>구매일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  구매 내역이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              result.purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>
                    <p className="font-medium">
                      {purchase.product?.name || purchase.product_name || "삭제된 상품"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {purchase.order_id}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {purchase.user?.email || (
                      <span className="text-muted-foreground">탈퇴한 회원</span>
                    )}
                  </TableCell>
                  <TableCell>
                    ₩{Number(purchase.amount).toLocaleString()}
                    {purchase.is_refunded && Number(purchase.refunded_amount) > 0 && (
                      <p className="text-xs text-red-500">
                        환불 ₩{Number(purchase.refunded_amount).toLocaleString()}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(purchase)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(purchase.created_at).toLocaleString("ko-KR", {
                      year: "2-digit",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {purchase.receipt_url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={purchase.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {purchase.status === "completed" && !purchase.is_refunded && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRefundTarget(purchase)}
                        >
                          환불
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {result.total.toLocaleString()}건 · {result.page}/{totalPages} 페이지
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={result.page <= 1}
              onClick={() => navigate(result.page - 1, search)}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={result.page >= totalPages}
              onClick={() => navigate(result.page + 1, search)}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* 환불 다이얼로그 */}
      <Dialog
        open={!!refundTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRefundTarget(null);
            setRefundReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환불 처리</DialogTitle>
            <DialogDescription>
              &ldquo;
              {refundTarget?.product?.name || refundTarget?.product_name}
              &rdquo; — ₩{Number(refundTarget?.amount ?? 0).toLocaleString()}을
              전액 환불합니다. PortOne 결제 취소가 즉시 실행되며 되돌릴 수
              없습니다.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="환불 사유 (선택)"
            rows={3}
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundTarget(null)}
              disabled={isRefunding}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={isRefunding}
            >
              {isRefunding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  처리 중...
                </>
              ) : (
                "환불 실행"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
