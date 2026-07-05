"use server";

import { createClient } from "@/lib/supabase/server";
import { getCreemClient, isCreemConfigured } from "@/lib/creem/client";
import { headers } from "next/headers";

// 현재 활성 구독 정보 조회
export async function getCurrentSubscription(): Promise<{
  planId: string;
  billingPeriod: "monthly" | "yearly";
  amount: number;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("plan_id, billing_period, amount")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || !data.plan_id) {
    return null;
  }

  return {
    planId: data.plan_id,
    billingPeriod: data.billing_period as "monthly" | "yearly",
    amount: data.amount,
  };
}

// 취소 예정 구독 정보 조회 (재구독 경고용)
export async function getPendingCancelledSubscription(): Promise<{
  hasPendingCancellation: boolean;
  remainingDays: number | null;
  planName: string | null;
  endDate: string | null;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, plan:pricing_plans(name)")
    .eq("user_id", user.id)
    .eq("status", "scheduled_cancel")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || !data.current_period_end) {
    return null;
  }

  const endDate = new Date(data.current_period_end);
  const now = new Date();

  // 이미 만료된 경우
  if (endDate <= now) {
    return null;
  }

  const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const plan = Array.isArray(data.plan) ? data.plan[0] : data.plan;

  return {
    hasPendingCancellation: true,
    remainingDays,
    planName: plan?.name || null,
    endDate: data.current_period_end,
  };
}

export async function createCheckoutSession(
  planId: string,
  billingPeriod: "monthly" | "yearly" = "monthly"
): Promise<{ checkoutUrl: string }> {
  if (!isCreemConfigured()) {
    throw new Error("결제 시스템이 설정되지 않았습니다.");
  }

  const supabase = await createClient();

  // 현재 사용자 이메일 조회
  const { data: { user } } = await supabase.auth.getUser();
  const customerEmail = user?.email;

  // 취소 예정 구독이 있는지 확인
  if (user) {
    const { data: pendingCancel } = await supabase
      .from("subscriptions")
      .select("id, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "scheduled_cancel")
      .gt("current_period_end", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (pendingCancel) {
      throw new Error(
        "취소 예정인 구독이 있습니다. 구독 관리에서 취소를 철회하거나, 만료 후 다시 구독해주세요."
      );
    }
  }

  // 플랜 조회
  const { data: plan, error } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .single();

  if (error || !plan) {
    throw new Error("플랜을 찾을 수 없습니다.");
  }

  // 결제 주기에 맞는 상품 ID 선택
  const productId = billingPeriod === "yearly"
    ? plan.creem_product_id_yearly
    : plan.creem_product_id;

  if (!productId) {
    throw new Error(
      billingPeriod === "yearly"
        ? "연간 결제가 아직 연동되지 않았습니다."
        : "월간 결제가 아직 연동되지 않았습니다."
    );
  }

  // 현재 URL에서 origin 추출
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  const creem = getCreemClient();
  const checkout = await creem.createCheckout({
    product_id: productId,
    success_url: `${origin}/pricing/success?plan=${planId}&period=${billingPeriod}`,
    ...(customerEmail && { customer: { email: customerEmail } }),
  });

  return { checkoutUrl: checkout.checkout_url };
}

export async function saveSubscription(data: {
  planId: string;
  period: string;
  checkoutId: string;
  orderId: string;
  customerId: string;
  subscriptionId: string;
  productId: string;
}): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  const supabase = await createClient();

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 중복 체크
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("creem_subscription_id", data.subscriptionId)
    .single();

  if (existing) {
    return { success: true, subscriptionId: existing.id };
  }

  // Creem API로 구독 상세 정보 조회
  let creemSubscription;
  try {
    const creem = getCreemClient();
    creemSubscription = await creem.getSubscription(data.subscriptionId);
  } catch (error) {
    console.error("Creem 구독 조회 실패:", error);
    return { success: false, error: "구독 정보를 조회할 수 없습니다." };
  }

  // 플랜 정보 조회
  const { data: plan, error: planError } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("id", data.planId)
    .single();

  if (planError || !plan) {
    return { success: false, error: "플랜 정보를 찾을 수 없습니다." };
  }

  // Creem 상태 그대로 사용
  const status = creemSubscription.status;

  // 구독 정보 저장 (Creem API에서 가져온 정확한 데이터 사용)
  const billingPeriod = data.period === "yearly" ? "yearly" : "monthly";
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      plan_id: data.planId,
      creem_subscription_id: data.subscriptionId,
      creem_customer_id: creemSubscription.customer.id,
      creem_order_id: data.orderId,
      creem_checkout_id: data.checkoutId,
      creem_product_id: creemSubscription.product.id,
      status,
      billing_period: billingPeriod,
      amount: creemSubscription.product.price / 100, // Creem은 센트 단위
      currency: creemSubscription.product.currency,
      current_period_start: creemSubscription.created_at,
      current_period_end: creemSubscription.next_transaction_date,
      cancelled_at: creemSubscription.canceled_at,
    })
    .select("id")
    .single();

  if (error) {
    console.error("구독 저장 오류:", error);
    return { success: false, error: "구독 정보 저장에 실패했습니다." };
  }

  return { success: true, subscriptionId: subscription.id };
}
