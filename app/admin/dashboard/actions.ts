"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export interface DailyRevenue {
  date: string; // YYYY-MM-DD (KST)
  revenue: number; // 완료 구매 금액 합 (환불 제외)
  count: number; // 구매 건수
}

export interface RevenueStats {
  daily: DailyRevenue[];
  totalRevenue: number;
  totalCount: number;
  refundedAmount: number; // 최근 30일 내 환불 발생액 (refunded_at 기준)
}

const DAYS = 30;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // KST = UTC+9 (DST 없음)

// UTC 시각 → KST 날짜 키 (YYYY-MM-DD)
function toKstDateKey(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

// 최근 30일 일별 매출/구매 통계 (product_purchases 기반, KST 기준)
export async function getRevenueStats(): Promise<RevenueStats> {
  await requireAdmin();

  const adminClient = createAdminClient();

  // KST 오늘 자정(포함 30일 전)을 UTC로 환산해 필터 경계와 버킷을 일치시킨다
  const nowKst = new Date(Date.now() + KST_OFFSET_MS);
  const todayKstMidnightUtc =
    Date.UTC(
      nowKst.getUTCFullYear(),
      nowKst.getUTCMonth(),
      nowKst.getUTCDate()
    ) - KST_OFFSET_MS;
  const since = new Date(todayKstMidnightUtc - (DAYS - 1) * 24 * 60 * 60 * 1000);

  const [{ data: purchases, error }, { data: refunds, error: refundError }] =
    await Promise.all([
      adminClient
        .from("product_purchases")
        .select("amount, status, is_refunded, created_at")
        .gte("created_at", since.toISOString()),
      // 환불액은 환불 발생일(refunded_at) 기준으로 별도 집계
      adminClient
        .from("product_purchases")
        .select("refunded_amount, refunded_at")
        .eq("is_refunded", true)
        .gte("refunded_at", since.toISOString()),
    ]);

  if (error) {
    throw new Error(error.message);
  }
  if (refundError) {
    throw new Error(refundError.message);
  }

  // 일별 버킷 초기화 (구매 없는 날도 0으로 표시)
  const buckets = new Map<string, DailyRevenue>();
  for (let i = 0; i < DAYS; i++) {
    const key = toKstDateKey(
      new Date(since.getTime() + i * 24 * 60 * 60 * 1000)
    );
    buckets.set(key, { date: key, revenue: 0, count: 0 });
  }

  let totalRevenue = 0;
  let totalCount = 0;

  for (const row of purchases ?? []) {
    if (row.status !== "completed" || row.is_refunded) continue;

    const amount = Number(row.amount) || 0;
    totalRevenue += amount;
    totalCount += 1;

    const bucket = buckets.get(toKstDateKey(new Date(row.created_at)));
    if (bucket) {
      bucket.revenue += amount;
      bucket.count += 1;
    }
  }

  const refundedAmount = (refunds ?? []).reduce(
    (sum, row) => sum + (Number(row.refunded_amount) || 0),
    0
  );

  return {
    daily: [...buckets.values()],
    totalRevenue,
    totalCount,
    refundedAmount,
  };
}
