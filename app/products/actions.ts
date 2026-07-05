"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPayment, PortOneApiError } from "@/lib/portone/client";
import type { Product, ProductPurchase } from "@/lib/types/product";

// 결제 요청 시 customData에 심은 orderId를 꺼낸다 (payment↔주문 결속 검증용)
function parseOrderIdFromCustomData(customData?: string): string | null {
  if (!customData) return null;
  try {
    const parsed = JSON.parse(customData);
    return typeof parsed?.orderId === "string" ? parsed.orderId : null;
  } catch {
    return null;
  }
}

// 공개 상품 목록 조회
export async function getPublishedProducts(): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("상품 목록 조회 오류:", error);
    return [];
  }

  return (data || []) as Product[];
}

// 상품 상세 조회 (slug 기반)
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Product;
}

// 현재 유저의 구매 여부 확인
export async function hasUserPurchasedProduct(
  productId: string
): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("product_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();

  return !!data;
}

// 결제 요청 전 pending_order 생성 (체크아웃 페이지에서 호출)
// 서버에서 금액을 고정해 클라이언트 금액 변조를 차단한다.
export async function createPendingOrder(
  productId: string
): Promise<{ orderId: string; amount: number; orderName: string }> {
  const adminClient = createAdminClient();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("is_published", true)
    .single();

  if (error || !product) {
    throw new Error("상품을 찾을 수 없습니다.");
  }

  if (product.is_coming_soon) {
    throw new Error("준비중인 상품은 아직 구매할 수 없습니다.");
  }

  if (product.price <= 0) {
    throw new Error("무료 상품은 결제가 필요하지 않습니다.");
  }

  // 이미 구매했는지 확인
  const { data: existing } = await supabase
    .from("product_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();

  if (existing) {
    throw new Error("이미 구매한 상품입니다.");
  }

  // 유효한 기존 pending 주문이 있으면 재사용 (새로고침마다 행이 쌓이는 것 방지)
  const { data: reusable } = await adminClient
    .from("pending_orders")
    .select("order_id, amount, expires_at")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reusable && Number(reusable.amount) === Number(product.price)) {
    return {
      orderId: reusable.order_id,
      amount: Number(product.price),
      orderName: product.name,
    };
  }

  // orderId 생성: ORDER_{productId 앞8자}_{timestamp}_{random}
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const orderId = `ORDER_${productId.substring(0, 8)}_${timestamp}_${random}`;

  const { error: insertError } = await adminClient
    .from("pending_orders")
    .insert({
      user_id: user.id,
      product_id: productId,
      order_id: orderId,
      amount: product.price,
      currency: product.currency || "KRW",
    });

  if (insertError) {
    console.error("주문 생성 오류:", insertError);
    throw new Error("주문 생성에 실패했습니다.");
  }

  return {
    orderId,
    // NUMERIC 칼럼은 문자열로 반환될 수 있으므로 숫자로 정규화해 반환
    amount: Number(product.price),
    orderName: product.name,
  };
}

// 결제 검증 + 구매 저장 (PortOne V2: 결제 위젯 성공 콜백에서 호출)
export async function confirmAndSavePurchase(
  paymentId: string,
  orderId: string
): Promise<{
  success: boolean;
  productSlug?: string;
  productName?: string;
  error?: string;
}> {
  const adminClient = createAdminClient();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 1. pending_orders에서 orderId로 조회 (본인 주문만)
  const { data: pendingOrder, error: pendingError } = await adminClient
    .from("pending_orders")
    .select("*")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .single();

  if (pendingError || !pendingOrder) {
    return { success: false, error: "주문 정보를 찾을 수 없습니다." };
  }

  // 이미 처리된 주문 — 멱등 처리 (성공 반환)
  if (pendingOrder.status === "completed") {
    const { data: product } = await adminClient
      .from("products")
      .select("slug, name")
      .eq("id", pendingOrder.product_id)
      .single();
    return {
      success: true,
      productSlug: product?.slug,
      productName: product?.name,
    };
  }

  // 만료된 주문은 거부한다
  if (
    pendingOrder.status === "expired" ||
    new Date(pendingOrder.expires_at) < new Date()
  ) {
    await adminClient
      .from("pending_orders")
      .update({ status: "expired" })
      .eq("order_id", orderId);
    return {
      success: false,
      error: "주문이 만료되었습니다. 결제가 진행됐다면 자동 취소되니 다시 시도해주세요.",
    };
  }

  // 2. 포트원 API로 결제 상태/금액 검증
  try {
    const payment = await getPayment(paymentId);

    if (payment.status !== "PAID") {
      return {
        success: false,
        error: `결제가 완료되지 않았습니다. (상태: ${payment.status})`,
      };
    }

    // 이 결제가 실제로 이 주문의 결제인지 결속 검증
    // (다른 주문의 paymentId를 재사용하는 공격 차단)
    const paidOrderId = parseOrderIdFromCustomData(payment.customData);
    if (paidOrderId !== orderId) {
      console.error(
        `[결제] payment↔주문 불일치: customData=${paidOrderId} vs 요청=${orderId}`
      );
      return { success: false, error: "결제 정보가 주문과 일치하지 않습니다." };
    }

    // 금액·통화 변조 확인
    if (payment.amount.total !== Number(pendingOrder.amount)) {
      return { success: false, error: "결제 금액이 일치하지 않습니다." };
    }
    if (payment.currency && payment.currency !== pendingOrder.currency) {
      return { success: false, error: "결제 통화가 일치하지 않습니다." };
    }

    // 상품명 스냅샷
    const { data: product } = await adminClient
      .from("products")
      .select("slug, name")
      .eq("id", pendingOrder.product_id)
      .single();

    // 3. product_purchases 저장 (portone_payment_id UNIQUE로 중복 차단)
    const { error: insertError } = await adminClient
      .from("product_purchases")
      .insert({
        user_id: user.id,
        product_id: pendingOrder.product_id,
        product_name: product?.name ?? null,
        order_id: orderId,
        portone_payment_id: paymentId,
        status: "completed",
        amount: payment.amount.total,
        currency: payment.currency || "KRW",
        payment_method: payment.method?.type || null,
        receipt_url: payment.receiptUrl || null,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        // unique_violation: 웹훅이 같은 주문을 먼저 처리한 정상 레이스인지 재확인
        // (다른 주문에 이미 쓰인 paymentId면 성공으로 오인하면 안 된다)
        const { data: duplicate } = await adminClient
          .from("product_purchases")
          .select("order_id, user_id")
          .eq("portone_payment_id", paymentId)
          .maybeSingle();

        if (
          !duplicate ||
          duplicate.order_id !== orderId ||
          duplicate.user_id !== user.id
        ) {
          return {
            success: false,
            error: "이미 다른 주문에 사용된 결제입니다.",
          };
        }
      } else {
        console.error("구매 저장 오류:", insertError);
        return { success: false, error: "구매 정보 저장에 실패했습니다." };
      }
    }

    // 4. pending_orders 완료 처리
    await adminClient
      .from("pending_orders")
      .update({ status: "completed" })
      .eq("order_id", orderId);

    return {
      success: true,
      productSlug: product?.slug,
      productName: product?.name,
    };
  } catch (err) {
    if (err instanceof PortOneApiError) {
      console.error("포트원 결제 검증 오류:", err.code, err.message);
      return { success: false, error: err.message };
    }
    console.error("결제 검증 오류:", err);
    return { success: false, error: "결제 검증에 실패했습니다." };
  }
}

// 현재 유저의 구매 내역 (마이페이지)
export async function getUserPurchases(): Promise<ProductPurchase[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // 상품 조인은 admin 클라이언트로 — 구매 후 상품이 비공개(unpublish)돼도
  // 구매자는 다운로드 링크 등 상품 정보에 계속 접근할 수 있어야 한다.
  // (소유권은 user_id 필터로 이미 보장됨)
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("product_purchases")
    .select("*, product:products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("구매 내역 조회 오류:", error);
    return [];
  }

  return (data || []) as ProductPurchase[];
}
