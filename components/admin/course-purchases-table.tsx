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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { MoreHorizontal, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { CoursePurchaseListItem } from "@/app/admin/course-purchases/actions";
import { cancelCoursePurchase } from "@/app/admin/course-purchases/actions";

interface Props {
  purchases: CoursePurchaseListItem[];
}

export function CoursePurchasesTable({ purchases }: Props) {
  const router = useRouter();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!cancelId) return;
    setIsCancelling(true);
    try {
      const result = await cancelCoursePurchase(cancelId);
      if (result.success) {
        toast.success("결제가 취소되었습니다.");
        router.refresh();
      } else {
        toast.error("취소 실패", { description: result.error });
      }
    } catch {
      toast.error("취소 처리 중 오류가 발생했습니다.");
    } finally {
      setIsCancelling(false);
      setCancelId(null);
    }
  };

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        코스 구매 내역이 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>주문번호</TableHead>
              <TableHead>코스명</TableHead>
              <TableHead>구매자</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead className="text-center">결제수단</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead>결제일</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-mono text-xs">
                  {purchase.toss_order_id
                    ? `${purchase.toss_order_id.substring(0, 20)}...`
                    : "-"}
                </TableCell>
                <TableCell className="font-medium">
                  {purchase.course?.title || "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {purchase.user?.email || "-"}
                </TableCell>
                <TableCell className="text-right">
                  ₩{purchase.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-center text-sm">
                  {purchase.payment_method || "-"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={
                      purchase.status === "completed"
                        ? "default"
                        : purchase.status === "refunded"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {purchase.status === "completed"
                      ? "완료"
                      : purchase.status === "refunded"
                        ? "환불"
                        : purchase.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(purchase.created_at).toLocaleDateString("ko-KR")}
                </TableCell>
                <TableCell>
                  {purchase.status === "completed" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setCancelId(purchase.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          결제 취소
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

      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>결제 취소</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 결제를 취소하시겠습니까?
              <br />
              토스페이먼츠를 통해 구매자에게 환불됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "처리 중..." : "결제 취소"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
