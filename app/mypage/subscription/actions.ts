"use server";

import { createClient } from "@/lib/supabase/server";
import { getCreemClient, isCreemConfigured } from "@/lib/creem/client";
import type { Subscription, PricingPlan } from "@/lib/types/admin";

export async function getUserSubscription(): Promise<Subscription | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // active 또는 scheduled_cancel(기간 남은) 구독 조회
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      `
      *,
      plan:pricing_plans(id, name, description, billing_type, price_monthly, price_yearly, features)
    `
    )
    .eq("user_id", user.id)
    .in("status", ["active", "scheduled_cancel"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  // scheduled_cancel 상태인 경우 Creem과 동기화
  if (data.status === "scheduled_cancel" && data.creem_subscription_id && isCreemConfigured()) {
    try {
      const creem = getCreemClient();
      const creemSubscription = await creem.getSubscription(data.creem_subscription_id);

      // Creem에서 active로 바뀌었으면 (resume됨) DB 업데이트
      if (creemSubscription.status === "active") {
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            cancelled_at: null,
            current_period_end: creemSubscription.next_transaction_date,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        // 업데이트된 데이터 반환
        return {
          ...data,
          status: "active",
          cancelled_at: null,
          current_period_end: creemSubscription.next_transaction_date,
        };
      }
    } catch (e) {
      console.error("Creem 구독 동기화 오류:", e);
      // 동기화 실패해도 기존 데이터 반환
    }
  }

  return data;
}

export async function cancelSubscription(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 활성 구독 조회
  const { data: subscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, creem_subscription_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (fetchError || !subscription) {
    return { success: false, error: "활성 구독을 찾을 수 없습니다." };
  }

  // Creem API로 구독 취소 요청 (기간 종료 시 취소)
  if (isCreemConfigured() && subscription.creem_subscription_id) {
    try {
      const creem = getCreemClient();
      await creem.cancelSubscription(subscription.creem_subscription_id, "scheduled");
    } catch (e) {
      console.error("Creem 구독 취소 오류:", e);
      return { success: false, error: "결제 시스템에서 구독 취소에 실패했습니다." };
    }
  }

  // DB 상태 업데이트 (scheduled 취소이므로 scheduled_cancel)
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "scheduled_cancel",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  if (updateError) {
    return { success: false, error: "구독 취소에 실패했습니다." };
  }

  return { success: true };
}

export async function upgradeSubscription(
  newPlanId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 현재 활성 구독 조회
  const { data: currentSubscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, creem_subscription_id, billing_period, plan_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (fetchError || !currentSubscription) {
    return { success: false, error: "활성 구독을 찾을 수 없습니다." };
  }

  if (currentSubscription.plan_id === newPlanId) {
    return { success: false, error: "이미 해당 플랜을 사용 중입니다." };
  }

  // 새 플랜 정보 조회
  const { data: newPlan, error: planError } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("id", newPlanId)
    .eq("is_active", true)
    .single();

  if (planError || !newPlan) {
    return { success: false, error: "플랜 정보를 찾을 수 없습니다." };
  }

  // 현재 결제 주기에 맞는 상품 ID 선택
  const newProductId = currentSubscription.billing_period === "yearly"
    ? newPlan.creem_product_id_yearly
    : newPlan.creem_product_id;

  if (!newProductId) {
    return { success: false, error: "해당 플랜의 상품이 연동되지 않았습니다." };
  }

  // Creem API로 업그레이드 요청
  if (!isCreemConfigured() || !currentSubscription.creem_subscription_id) {
    return { success: false, error: "결제 시스템이 설정되지 않았습니다." };
  }

  let upgradedSubscription;
  try {
    const creem = getCreemClient();
    upgradedSubscription = await creem.upgradeSubscription(
      currentSubscription.creem_subscription_id,
      newProductId,
      "proration-charge-immediately"
    );
  } catch (e) {
    console.error("Creem 업그레이드 오류:", e);
    return { success: false, error: "플랜 업그레이드에 실패했습니다." };
  }

  // DB 업데이트
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      plan_id: newPlanId,
      creem_product_id: upgradedSubscription.product.id,
      amount: upgradedSubscription.product.price / 100,
      status: upgradedSubscription.status,
      current_period_end: upgradedSubscription.next_transaction_date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentSubscription.id);

  if (updateError) {
    console.error("구독 업데이트 오류:", updateError);
    return { success: false, error: "구독 정보 업데이트에 실패했습니다." };
  }

  return { success: true };
}

export async function getUpgradeablePlans(): Promise<PricingPlan[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // 현재 구독 조회
  const { data: currentSubscription } = await supabase
    .from("subscriptions")
    .select("plan_id, billing_period, plan:pricing_plans(price_monthly, price_yearly)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!currentSubscription) {
    return [];
  }

  const currentPlan = Array.isArray(currentSubscription.plan)
    ? currentSubscription.plan[0]
    : currentSubscription.plan;

  const currentPrice = currentSubscription.billing_period === "yearly"
    ? (currentPlan?.price_yearly || 0)
    : (currentPlan?.price_monthly || 0);

  // 현재 플랜보다 가격이 높은 활성 플랜 조회
  const priceColumn = currentSubscription.billing_period === "yearly"
    ? "price_yearly"
    : "price_monthly";

  const { data: plans } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("is_active", true)
    .eq("billing_type", "recurring")
    .neq("id", currentSubscription.plan_id)
    .gt(priceColumn, currentPrice)
    .order("display_order", { ascending: true });

  return plans || [];
}
