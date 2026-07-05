"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCreemClient, isCreemConfigured } from "@/lib/creem/client";
import type { Subscription, SubscriptionStatus } from "@/lib/types/admin";
import { isSuperAdmin } from "@/lib/admin/auth";

export interface SubscriptionsListResponse {
  subscriptions: Subscription[];
  total: number;
  page: number;
  perPage: number;
}

export async function getSubscriptions(
  page: number = 1,
  perPage: number = 20,
  statusFilter?: SubscriptionStatus,
  search?: string
): Promise<SubscriptionsListResponse> {
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
    .from("subscriptions")
    .select(
      `
      *,
      plan:pricing_plans(id, name, billing_type)
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
        return { subscriptions: [], total: 0, page, perPage };
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
    console.error("구독 조회 오류:", error);
    throw new Error("구독 목록을 불러오는데 실패했습니다.");
  }

  // 사용자 정보 별도 조회 (admin 클라이언트 사용)
  const userIds = [...new Set((data || []).map((s) => s.user_id).filter(Boolean))];
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

  const subscriptions = (data || []).map((item) => ({
    ...item,
    user: item.user_id ? userMap[item.user_id] : undefined,
  }));

  return {
    subscriptions,
    total: count || 0,
    page,
    perPage,
  };
}

export async function updateSubscriptionStatus(
  id: string,
  status: SubscriptionStatus,
  cancelMode: "immediate" | "scheduled" = "immediate"
): Promise<Subscription> {
  const canManage = await isSuperAdmin();
  if (!canManage) {
    throw new Error("권한이 없습니다.");
  }

  const supabase = await createClient();

  // 구독 취소 시 Creem API 호출 (canceled 또는 scheduled_cancel)
  if (status === "canceled" || status === "scheduled_cancel") {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("creem_subscription_id")
      .eq("id", id)
      .single();

    if (subscription?.creem_subscription_id && isCreemConfigured()) {
      try {
        const creem = getCreemClient();
        await creem.cancelSubscription(subscription.creem_subscription_id, cancelMode);
      } catch (e) {
        console.error("Creem 구독 취소 오류:", e);
        throw new Error("Creem에서 구독 취소에 실패했습니다.");
      }
    }
  }

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "canceled" || status === "scheduled_cancel") {
    updateData.cancelled_at = new Date().toISOString();
    // 즉시 취소(canceled)면 current_period_end도 현재로 설정
    if (status === "canceled") {
      updateData.current_period_end = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("구독 상태 업데이트 오류:", error);
    throw new Error("구독 상태를 업데이트하는데 실패했습니다.");
  }

  return data;
}

export async function getSubscriptionStats(): Promise<{
  total: number;
  active: number;
  scheduled_cancel: number;
  canceled: number;
}> {
  const supabase = await createClient();

  const { count: total } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true });

  const { count: active } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: scheduled_cancel } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "scheduled_cancel");

  const { count: canceled } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "canceled");

  return {
    total: total || 0,
    active: active || 0,
    scheduled_cancel: scheduled_cancel || 0,
    canceled: canceled || 0,
  };
}

export async function syncSubscriptionWithCreem(
  subscriptionId: string
): Promise<{ success: boolean; newStatus?: SubscriptionStatus; isRefunded?: boolean; refundedAmount?: number; error?: string }> {
  const canManage = await isSuperAdmin();
  if (!canManage) {
    return { success: false, error: "권한이 없습니다." };
  }

  if (!isCreemConfigured()) {
    return { success: false, error: "Creem이 설정되지 않았습니다." };
  }

  const supabase = await createClient();

  // 구독 조회
  const { data: subscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, creem_subscription_id, creem_order_id, status, is_refunded, refunded_amount")
    .eq("id", subscriptionId)
    .single();

  if (fetchError || !subscription) {
    return { success: false, error: "구독을 찾을 수 없습니다." };
  }

  if (!subscription.creem_subscription_id) {
    return { success: false, error: "Creem 구독 ID가 없습니다." };
  }

  const creem = getCreemClient();

  // Creem API에서 최신 상태 조회
  let creemSubscription;
  try {
    creemSubscription = await creem.getSubscription(subscription.creem_subscription_id);
  } catch (e) {
    console.error("Creem 구독 조회 오류:", e);
    return { success: false, error: "Creem에서 구독 정보를 가져올 수 없습니다." };
  }

  // 환불 정보 조회 (Order ID로 트랜잭션 검색)
  let refundInfo = { isRefunded: false, refundedAmount: 0 };
  if (subscription.creem_order_id) {
    refundInfo = await creem.getRefundInfoByOrderId(subscription.creem_order_id);
  }

  const currentIsRefunded = subscription.is_refunded ?? false;
  const currentRefundedAmount = subscription.refunded_amount ?? 0;
  const newRefundedAmount = refundInfo.refundedAmount / 100; // 센트 → 달러 변환

  // 환불이 완료되었으면 Creem 상태와 상관없이 canceled로 처리 (Creem 버그 대응)
  const newStatus = refundInfo.isRefunded ? "canceled" : creemSubscription.status;

  const hasChanges =
    subscription.status !== newStatus ||
    currentIsRefunded !== refundInfo.isRefunded ||
    currentRefundedAmount !== newRefundedAmount;

  // 변경사항이 있으면 업데이트
  if (hasChanges) {
    const updateData: Record<string, unknown> = {
      status: newStatus,
      is_refunded: refundInfo.isRefunded,
      refunded_amount: newRefundedAmount,
      updated_at: new Date().toISOString(),
    };

    // canceled로 변경되면 current_period_end도 현재로 설정
    if (newStatus === "canceled") {
      updateData.current_period_end = new Date().toISOString();
      updateData.cancelled_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", subscriptionId);

    if (updateError) {
      return { success: false, error: "상태 업데이트에 실패했습니다." };
    }

    return {
      success: true,
      newStatus: newStatus as SubscriptionStatus,
      isRefunded: refundInfo.isRefunded,
      refundedAmount: newRefundedAmount,
    };
  }

  return {
    success: true,
    newStatus: subscription.status as SubscriptionStatus,
    isRefunded: currentIsRefunded,
    refundedAmount: currentRefundedAmount,
  };
}
