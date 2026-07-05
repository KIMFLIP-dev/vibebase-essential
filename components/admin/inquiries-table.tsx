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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  answerInquiry,
  closeInquiry,
  type InquiriesListResult,
} from "@/app/admin/inquiries/actions";
import type { Inquiry, InquiryStatus } from "@/lib/types/inquiry";

interface InquiriesTableProps {
  result: InquiriesListResult;
  statusFilter: InquiryStatus | "all";
}

const FILTERS: { value: InquiryStatus | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "open", label: "답변 대기" },
  { value: "answered", label: "답변 완료" },
  { value: "closed", label: "종료" },
];

function statusBadge(status: InquiryStatus) {
  switch (status) {
    case "open":
      return <Badge variant="secondary">답변 대기</Badge>;
    case "answered":
      return <Badge>답변 완료</Badge>;
    case "closed":
      return <Badge variant="outline">종료</Badge>;
  }
}

export function InquiriesTable({ result, statusFilter }: InquiriesTableProps) {
  const router = useRouter();
  const inquiries = result.inquiries;
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));
  const [target, setTarget] = useState<Inquiry | null>(null);
  const [answer, setAnswer] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const navigate = (page: number) => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.push(`/admin/inquiries${qs ? `?${qs}` : ""}`);
  };

  const openDialog = (inquiry: Inquiry) => {
    setTarget(inquiry);
    setAnswer(inquiry.answer ?? "");
  };

  const handleAnswer = async () => {
    if (!target) return;
    setIsSaving(true);
    try {
      const res = await answerInquiry(target.id, answer);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("답변이 등록되었습니다.");
      setTarget(null);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = async (inquiry: Inquiry) => {
    const res = await closeInquiry(inquiry.id);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("문의가 종료되었습니다.");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* 상태 필터 */}
      <div className="flex gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() =>
              router.push(
                filter.value === "all"
                  ? "/admin/inquiries"
                  : `/admin/inquiries?status=${filter.value}`
              )
            }
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>작성자</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>작성일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  문의가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-medium max-w-xs">
                    <p className="truncate">{inquiry.title}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {inquiry.user?.email || (
                      <span className="text-muted-foreground">알 수 없음</span>
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(inquiry.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inquiry.created_at).toLocaleString("ko-KR", {
                      year: "2-digit",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(inquiry)}
                      >
                        {inquiry.status === "open" ? "답변하기" : "보기"}
                      </Button>
                      {inquiry.status !== "closed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClose(inquiry)}
                        >
                          종료
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
              onClick={() => navigate(result.page - 1)}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={result.page >= totalPages}
              onClick={() => navigate(result.page + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* 답변 다이얼로그 */}
      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{target?.title}</DialogTitle>
            <DialogDescription>
              {target?.user?.email} ·{" "}
              {target &&
                new Date(target.created_at).toLocaleString("ko-KR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
            {target?.message}
          </div>

          {target?.status === "closed" ? (
            target.answer && (
              <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap">
                {target.answer}
              </div>
            )
          ) : (
            <Textarea
              placeholder="답변을 입력하세요"
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTarget(null)}
              disabled={isSaving}
            >
              닫기
            </Button>
            {target?.status !== "closed" && (
              <Button onClick={handleAnswer} disabled={isSaving || !answer.trim()}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "답변 등록"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
