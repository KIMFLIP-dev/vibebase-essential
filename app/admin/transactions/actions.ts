"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCreemClient, isCreemConfigured, CreemTransaction } from "@/lib/creem/client";
import type { Transaction, TransactionsListResponse, TransactionStatus } from "@/lib/types/admin";
import { isSuperAdmin } from "@/lib/admin/auth";

export async function getTransactions(
  page: number = 1,
  perPage: number = 10,
  statusFilter?: TransactionStatus,
  search?: string
): Promise<TransactionsListResponse> {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .order("creem_created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (search) {
    if (search.includes("@")) {
      query = query.ilike("user_email", `%${search}%`);
    } else {
      query = query.ilike("creem_order_id", `%${search}%`);
    }
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("트랜잭션 조회 오류:", error);
    throw new Error("트랜잭션 목록을 불러오는데 실패했습니다.");
  }

  return {
    transactions: data || [],
    total: count || 0,
    page,
    perPage,
  };
}

export type SyncRange = "7days" | "30days" | "90days" | "all";

export interface SyncResult {
  success: boolean;
  added: number;
  updated: number;
  error?: string;
}

function getStartDateForRange(range: SyncRange): string | undefined {
  if (range === "all") return undefined;

  const now = new Date();
  const days = range === "7days" ? 7 : range === "30days" ? 30 : 90;
  now.setDate(now.getDate() - days);
  return now.toISOString();
}

export async function syncTransactionsFromCreem(range: SyncRange): Promise<SyncResult> {
  const canManage = await isSuperAdmin();
  if (!canManage) {
    return { success: false, added: 0, updated: 0, error: "권한이 없습니다." };
  }

  if (!isCreemConfigured()) {
    return { success: false, added: 0, updated: 0, error: "Creem이 설정되지 않았습니다." };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();
  const creem = getCreemClient();

  try {
    const startDate = getStartDateForRange(range);
    const creemTransactions = await creem.getAllTransactions({ startDate });

    let added = 0;
    let updated = 0;

    for (const tx of creemTransactions) {
      const { data: existing } = await supabase
        .from("transactions")
        .select("id, status, refunded_amount")
        .eq("creem_transaction_id", tx.id)
        .single();

      // Creem created_at이 밀리초 timestamp일 수 있음
      let creemCreatedAt: string | null = null;
      if (tx.created_at) {
        // 숫자면 밀리초 timestamp, 문자열이면 ISO 날짜
        if (typeof tx.created_at === "number" || /^\d+$/.test(tx.created_at)) {
          creemCreatedAt = new Date(Number(tx.created_at)).toISOString();
        } else {
          creemCreatedAt = tx.created_at;
        }
      }

      // Creem API 응답 구조에 맞게 필드 추출
      const txAny = tx as unknown as Record<string, unknown>;
      const orderId = (txAny.order as string) || null;
      const subscriptionId = (txAny.subscription as string) || null;
      const customerId = (txAny.customer as string) || null;

      // subscriptions 테이블에서 이메일 가져오기
      let userEmail: string | null = null;
      if (orderId) {
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("creem_order_id", orderId)
          .single();

        if (subData?.user_id) {
          const { data: userData } = await adminClient.auth.admin.getUserById(subData.user_id);
          userEmail = userData?.user?.email || null;
        }
      }

      const transactionData = {
        creem_transaction_id: tx.id,
        creem_order_id: orderId,
        creem_subscription_id: subscriptionId,
        creem_customer_id: customerId,
        user_email: userEmail,
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        currency: tx.currency,
        refunded_amount: tx.refunded_amount || 0,
        creem_created_at: creemCreatedAt,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        // 상태나 환불금액이 변경된 경우에만 업데이트
        if (existing.status !== tx.status || existing.refunded_amount !== (tx.refunded_amount || 0)) {
          const { error: updateError } = await supabase
            .from("transactions")
            .update({
              status: tx.status,
              refunded_amount: tx.refunded_amount || 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          if (updateError) {
            console.error("트랜잭션 업데이트 오류:", updateError);
          } else {
            updated++;
          }
        }
      } else {
        const { error: insertError } = await supabase
          .from("transactions")
          .insert({
            ...transactionData,
            created_at: new Date().toISOString(),
          });
        if (insertError) {
          console.error("트랜잭션 추가 오류:", insertError);
        } else {
          added++;
        }
      }
    }

    return { success: true, added, updated };
  } catch (error) {
    console.error("Creem 동기화 오류:", error);
    return {
      success: false,
      added: 0,
      updated: 0,
      error: error instanceof Error ? error.message : "동기화에 실패했습니다.",
    };
  }
}

export async function getTransactionStats(): Promise<{
  total: number;
  succeeded: number;
  refunded: number;
  failed: number;
}> {
  const supabase = await createClient();

  const { count: total } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true });

  const { count: succeeded } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("status", "succeeded");

  const { count: refunded } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("status", "refunded");

  const { count: failed } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed");

  return {
    total: total || 0,
    succeeded: succeeded || 0,
    refunded: refunded || 0,
    failed: failed || 0,
  };
}
