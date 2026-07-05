"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { syncTransactionsFromCreem, SyncRange } from "@/app/admin/transactions/actions";
import { toast } from "sonner";

export function TransactionSync() {
  const router = useRouter();
  const [range, setRange] = useState<SyncRange>("30days");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncTransactionsFromCreem(range);
      if (result.success) {
        if (result.added > 0 || result.updated > 0) {
          toast.success(`동기화 완료: ${result.added}건 추가, ${result.updated}건 업데이트`);
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
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={range} onValueChange={(v) => setRange(v as SyncRange)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">최근 7일</SelectItem>
          <SelectItem value="30days">최근 30일</SelectItem>
          <SelectItem value="90days">최근 90일</SelectItem>
          <SelectItem value="all">전체</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleSync} disabled={isSyncing}>
        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "동기화 중..." : "Creem 동기화"}
      </Button>
    </div>
  );
}
