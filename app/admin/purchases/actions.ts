"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { cancelPayment, PortOneApiError } from "@/lib/portone/client";
import { revalidatePath } from "next/cache";
import type { ProductPurchase } from "@/lib/types/product";

const PER_PAGE = 20;

export interface PurchasesListResult {
  purchases: ProductPurchase[];
  total: number;
  page: number;
  perPage: number;
}

// 구매 내역 목록 (검색 + 페이지네이션, 이메일은 auth API로 보강)
export async function getAdminPurchases(options?: {
  page?: number;
  search?: string;
}): Promise<PurchasesListResult> {
  await requireAdmin();

  const page = Math.max(1, options?.page ?? 1);
  const search = options?.search?.trim() || "";

  const adminClient = createAdminClient();

  let query = adminClient
    .from("product_purchases")
    .select("*, product:products(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

  if (search) {
    // PostgREST 필터 예약문자(콤마·괄호·따옴표) 방어 — 필터 구조 파손 방지
    const safe = search.replace(/["\\(),]/g, " ").trim();
    if (safe) {
      query = query.or(
        `order_id.ilike."%${safe}%",product_name.ilike."%${safe}%",portone_payment_id.ilike."%${safe}%"`
      );
    }
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const purchases = (data ?? []) as ProductPurchase[];

  // 구매자 이메일 보강 (auth.users는 조인 불가 — admin API로 조회)
  const userIds = [
    ...new Set(purchases.map((p) => p.user_id).filter(Boolean)),
  ] as string[];

  const emailMap = new Map<string, string>();
  await Promise.all(
    userIds.map(async (userId) => {
      const { data: userData } = await adminClient.auth.admin.getUserById(userId);
      if (userData.user?.email) {
        emailMap.set(userId, userData.user.email);
      }
    })
  );

  for (const purchase of purchases) {
    if (purchase.user_id && emailMap.has(purchase.user_id)) {
      purchase.user = {
        email: emailMap.get(purchase.user_id)!,
        user_metadata: {},
      };
    }
  }

  return { purchases, total: count ?? 0, page, perPage: PER_PAGE };
}

// 환불 처리 (PortOne 결제 취소 API 호출 → 웹훅 + 즉시 DB 반영)
export async function refundPurchase(
  purchaseId: string,
  reason: string
): Promise<{ error?: string }> {
  await requireAdmin();

  const cancelReason = reason?.trim() || "관리자 환불 처리";

  const adminClient = createAdminClient();

  const { data: purchase, error: fetchError } = await adminClient
    .from("product_purchases")
    .select("*")
    .eq("id", purchaseId)
    .single();

  if (fetchError || !purchase) {
    return { error: "구매 기록을 찾을 수 없습니다." };
  }

  if (purchase.status !== "completed" || purchase.is_refunded) {
    return { error: "환불 가능한 상태가 아닙니다." };
  }

  if (!purchase.portone_payment_id) {
    return { error: "결제 식별자가 없어 환불할 수 없습니다." };
  }

  try {
    const payment = await cancelPayment(purchase.portone_payment_id, {
      cancelReason,
    });

    // 웹훅(Transaction.Cancelled)도 반영하지만, 즉시성을 위해 여기서도 갱신
    const cancelAmount =
      payment.cancellations?.reduce((sum, c) => sum + c.totalAmount, 0) ||
      Number(purchase.amount);

    // is_refunded=false 조건부 업데이트 — 동시 요청 선점 방어
    const { error: updateError } = await adminClient
      .from("product_purchases")
      .update({
        status: "refunded",
        is_refunded: true,
        refunded_amount: cancelAmount,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", purchaseId)
      .eq("is_refunded", false);

    if (updateError) {
      // PortOne 취소는 이미 완료 — 성공으로 위장하면 관리자가 상태를
      // 오인하고 구매자 접근 권한도 유지되므로 반드시 실패를 노출한다
      console.error("[환불] PortOne 취소 성공 후 DB 반영 실패:", updateError);
      return {
        error:
          "결제는 취소되었으나 상태 반영에 실패했습니다. 목록을 새로고침해 확인해주세요.",
      };
    }

    revalidatePath("/admin/purchases");
    return {};
  } catch (err) {
    if (err instanceof PortOneApiError) {
      console.error("[환불] 포트원 취소 실패:", err.code, err.message);
      return { error: `환불 실패: ${err.message}` };
    }
    console.error("[환불] 오류:", err);
    return { error: "환불 처리에 실패했습니다." };
  }
}
