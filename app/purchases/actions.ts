"use server";

import { createClient } from "@/lib/supabase/server";
import { getCreemClient, isCreemConfigured } from "@/lib/creem/client";
import { headers } from "next/headers";
import type { PricingPlan, Purchase } from "@/lib/types/admin";

// 활성 단건 결제 상품 조회
export async function getActiveOnetimePlans(): Promise<PricingPlan[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("is_active", true)
    .eq("billing_type", "onetime")
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as PricingPlan[];
}

// 체크아웃 세션 생성
export async function createPurchaseCheckoutSession(
  planId: string
): Promise<{ checkoutUrl: string }> {
  if (!isCreemConfigured()) {
    throw new Error("결제 시스템이 설정되지 않았습니다.");
  }

  const supabase = await createClient();

  // 현재 사용자 이메일 조회
  const { data: { user } } = await supabase.auth.getUser();
  const customerEmail = user?.email;

  // 플랜 조회
  const { data: plan, error } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .eq("billing_type", "onetime")
    .single();

  if (error || !plan) {
    throw new Error("상품을 찾을 수 없습니다.");
  }

  const productId = plan.creem_product_id;

  if (!productId) {
    throw new Error("결제가 아직 연동되지 않았습니다.");
  }

  // 현재 URL에서 origin 추출
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  const creem = getCreemClient();
  const checkout = await creem.createCheckout({
    product_id: productId,
    success_url: `${origin}/purchases/success?plan=${planId}`,
    ...(customerEmail && { customer: { email: customerEmail } }),
  });

  return { checkoutUrl: checkout.checkout_url };
}

// 구매 저장 (success 페이지에서 호출)
export async function savePurchase(data: {
  planId: string;
  checkoutId: string;
  orderId: string;
  customerId: string;
  productId: string;
}): Promise<{ success: boolean; purchaseId?: string; planName?: string; error?: string }> {
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
    .from("purchases")
    .select("id")
    .eq("creem_order_id", data.orderId)
    .single();

  if (existing) {
    // 기존 구매에서 플랜명 조회
    const { data: plan } = await supabase
      .from("pricing_plans")
      .select("name")
      .eq("id", data.planId)
      .single();
    return { success: true, purchaseId: existing.id, planName: plan?.name };
  }

  // 플랜 정보 조회
  const { data: plan, error: planError } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("id", data.planId)
    .single();

  if (planError || !plan) {
    return { success: false, error: "상품 정보를 찾을 수 없습니다." };
  }

  // 구매 정보 저장
  const { data: purchase, error } = await supabase
    .from("purchases")
    .insert({
      user_id: user.id,
      plan_id: data.planId,
      creem_checkout_id: data.checkoutId,
      creem_order_id: data.orderId,
      creem_customer_id: data.customerId,
      creem_product_id: data.productId,
      status: "completed",
      amount: plan.price_monthly,
      currency: plan.currency || "USD",
    })
    .select("id")
    .single();

  if (error) {
    console.error("구매 저장 오류:", error);
    return { success: false, error: "구매 정보 저장에 실패했습니다." };
  }

  return { success: true, purchaseId: purchase.id, planName: plan.name };
}

// 사용자 구매 내역 조회
export async function getUserPurchases(): Promise<Purchase[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("purchases")
    .select(
      `
      *,
      plan:pricing_plans(id, name, description, billing_type, download_url)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("구매 내역 조회 오류:", error);
    return [];
  }

  return data as Purchase[];
}
