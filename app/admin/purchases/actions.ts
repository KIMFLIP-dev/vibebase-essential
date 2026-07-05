"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCreemClient, isCreemConfigured } from "@/lib/creem/client";
import type { PurchaseStatus, PurchasesListResponse } from "@/lib/types/admin";
import { isSuperAdmin } from "@/lib/admin/auth";

export async function getPurchases(
  page: number = 1,
  perPage: number = 20,
  statusFilter?: PurchaseStatus,
  search?: string
): Promise<PurchasesListResponse> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 이메일 검색인 경우 먼저 user_id 찾기
  let searchUserIds: string[] | null = null;
  if (search && search.includes("@")) {
    try {
      const { data: usersData } = await adminClient.auth.admin.listUsers();
      if (usersData?.users) {
        searchUserIds = usersData.users
          .filter((user) => user.email?.toLowerCase().includes(search.toLowerCase()))
          .map((user) => user.id);
      }
    } catch (e) {
      console.error("사용자 검색 오류:", e);
    }
  }

  let query = supabase
    .from("purchases")
    .select(
      `
      *,
      plan:pricing_plans(id, name, billing_type, download_url)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  // 검색 필터 적용
  if (search) {
    if (search.includes("@") && searchUserIds !== null) {
      // 이메일 검색
      if (searchUserIds.length > 0) {
        query = query.in("user_id", searchUserIds);
      } else {
        // 일치하는 이메일이 없으면 빈 결과 반환
        return { purchases: [], total: 0, page, perPage };
      }
    } else {
      // Order ID 검색
      query = query.ilike("creem_order_id", `%${search}%`);
    }
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("구매 조회 오류:", error);
    throw new Error("구매 목록을 불러오는데 실패했습니다.");
  }

  // 사용자 정보 별도 조회 (admin 클라이언트 사용)
  const userIds = [...new Set((data || []).map((p) => p.user_id).filter(Boolean))];
  const userMap: Record<string, { email: string; user_metadata: Record<string, unknown> }> = {};

  if (userIds.length > 0) {
    try {
      const { data: usersData } = await adminClient.auth.admin.listUsers();
      if (usersData?.users) {
        for (const user of usersData.users) {
          if (userIds.includes(user.id)) {
            userMap[user.id] = {
              email: user.email || "",
              user_metadata: user.user_metadata || {},
            };
          }
        }
      }
    } catch (e) {
      console.error("사용자 정보 조회 오류:", e);
    }
  }

  const purchases = (data || []).map((item) => ({
    ...item,
    user: item.user_id ? userMap[item.user_id] : undefined,
  }));

  return {
    purchases,
    total: count || 0,
    page,
    perPage,
  };
}

export async function getPurchaseStats(): Promise<{
  total: number;
  completed: number;
  refunded: number;
}> {
  const supabase = await createClient();

  const { count: total } = await supabase
    .from("purchases")
    .select("*", { count: "exact", head: true });

  const { count: completed } = await supabase
    .from("purchases")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const { count: refunded } = await supabase
    .from("purchases")
    .select("*", { count: "exact", head: true })
    .eq("is_refunded", true);

  return {
    total: total || 0,
    completed: completed || 0,
    refunded: refunded || 0,
  };
}

export async function syncPurchaseWithCreem(
  purchaseId: string
): Promise<{ success: boolean; isRefunded?: boolean; refundedAmount?: number; error?: string }> {
  const canManage = await isSuperAdmin();
  if (!canManage) {
    return { success: false, error: "권한이 없습니다." };
  }

  if (!isCreemConfigured()) {
    return { success: false, error: "Creem이 설정되지 않았습니다." };
  }

  const supabase = await createClient();

  // 구매 조회
  const { data: purchase, error: fetchError } = await supabase
    .from("purchases")
    .select("id, creem_order_id, status, is_refunded, refunded_amount, amount")
    .eq("id", purchaseId)
    .single();

  if (fetchError || !purchase) {
    return { success: false, error: "구매를 찾을 수 없습니다." };
  }

  if (!purchase.creem_order_id) {
    return { success: false, error: "Creem Order ID가 없습니다." };
  }

  const creem = getCreemClient();

  // 환불 정보 조회 (Order ID로 트랜잭션 검색)
  const refundInfo = await creem.getRefundInfoByOrderId(purchase.creem_order_id);

  const currentIsRefunded = purchase.is_refunded ?? false;
  const currentRefundedAmount = purchase.refunded_amount ?? 0;
  const newRefundedAmount = refundInfo.refundedAmount / 100; // 센트 → 달러 변환

  const hasChanges =
    currentIsRefunded !== refundInfo.isRefunded ||
    currentRefundedAmount !== newRefundedAmount;

  // 변경사항이 있으면 업데이트
  if (hasChanges) {
    const updateData: Record<string, unknown> = {
      is_refunded: refundInfo.isRefunded,
      refunded_amount: newRefundedAmount,
      updated_at: new Date().toISOString(),
    };

    // 전액 환불이면 상태도 refunded로 변경
    if (refundInfo.isRefunded && newRefundedAmount >= purchase.amount) {
      updateData.status = "refunded";
      updateData.refunded_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("purchases")
      .update(updateData)
      .eq("id", purchaseId);

    if (updateError) {
      return { success: false, error: "상태 업데이트에 실패했습니다." };
    }

    return {
      success: true,
      isRefunded: refundInfo.isRefunded,
      refundedAmount: newRefundedAmount,
    };
  }

  return {
    success: true,
    isRefunded: currentIsRefunded,
    refundedAmount: currentRefundedAmount,
  };
}

