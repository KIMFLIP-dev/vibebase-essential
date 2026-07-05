import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET;

// Service role client for webhook processing
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey);
}

// Signature 검증
function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn("CREEM_WEBHOOK_SECRET not set, skipping signature verification");
    return true;
  }

  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

interface WebhookEvent {
  id: string;
  type: string;
  data: {
    id?: string;
    object?: string;
    subscription_id?: string;
    customer_id?: string;
    product_id?: string;
    order_id?: string;
    checkout_id?: string;
    status?: string;
    current_period_start?: string;
    current_period_end?: string;
    cancelled_at?: string;
    amount?: number;
    currency?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-creem-signature") || "";

    // Signature 검증
    if (WEBHOOK_SECRET && !verifySignature(payload, signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event: WebhookEvent = JSON.parse(payload);
    console.log("Webhook received:", event.type, event.id);

    const supabase = getSupabaseAdmin();

    switch (event.type) {
      case "subscription.created":
        await handleSubscriptionCreated(supabase, event.data);
        break;

      case "subscription.updated":
        await handleSubscriptionUpdated(supabase, event.data);
        break;

      case "subscription.cancelled":
      case "subscription.canceled":
        await handleSubscriptionCancelled(supabase, event.data);
        break;

      case "subscription.renewed":
        await handleSubscriptionRenewed(supabase, event.data);
        break;

      case "payment.failed":
        await handlePaymentFailed(supabase, event.data);
        break;

      case "checkout.completed":
        await handleCheckoutCompleted(supabase, event.data);
        break;

      default:
        console.log("Unhandled webhook event:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: WebhookEvent["data"]
) {
  console.log("Subscription created:", data.subscription_id);
  // Success 페이지에서 이미 처리되므로 중복 체크
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("creem_subscription_id", data.subscription_id)
    .single();

  if (existing) {
    console.log("Subscription already exists, skipping");
    return;
  }

  // 필요시 여기서 구독 생성 처리
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: WebhookEvent["data"]
) {
  console.log("Subscription updated:", data.subscription_id);

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.status) {
    updateData.status = data.status;
  }

  if (data.current_period_start) {
    updateData.current_period_start = data.current_period_start;
  }

  if (data.current_period_end) {
    updateData.current_period_end = data.current_period_end;
  }

  await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("creem_subscription_id", data.subscription_id);
}

async function handleSubscriptionCancelled(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: WebhookEvent["data"]
) {
  console.log("Subscription cancelled:", data.subscription_id);

  // Creem에서 canceled 이벤트가 오면 즉시 취소된 것
  // scheduled_cancel은 subscription.updated로 처리됨
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      cancelled_at: data.cancelled_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("creem_subscription_id", data.subscription_id);
}

async function handleSubscriptionRenewed(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: WebhookEvent["data"]
) {
  console.log("Subscription renewed:", data.subscription_id);

  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: data.current_period_start,
      current_period_end: data.current_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("creem_subscription_id", data.subscription_id);
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: WebhookEvent["data"]
) {
  console.log("Payment failed:", data.subscription_id);

  await supabase
    .from("subscriptions")
    .update({
      status: "unpaid",
      updated_at: new Date().toISOString(),
    })
    .eq("creem_subscription_id", data.subscription_id);
}

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: WebhookEvent["data"]
) {
  console.log("Checkout completed:", data);

  // subscription_id가 있으면 구독 결제, 없으면 단건 결제
  if (data.subscription_id) {
    // 구독 결제는 subscription.created 또는 success 페이지에서 처리
    console.log("Subscription checkout, skipping (handled elsewhere)");
    return;
  }

  // 단건 결제 처리 (order_id만 있는 경우)
  if (!data.order_id) {
    console.log("No order_id in checkout.completed event, skipping");
    return;
  }

  // 중복 체크
  const { data: existing } = await supabase
    .from("purchases")
    .select("id")
    .eq("creem_order_id", data.order_id)
    .single();

  if (existing) {
    console.log("Purchase already exists for order:", data.order_id);
    return;
  }

  // 웹훅에서는 user_id를 알 수 없으므로, 백업용으로 저장
  // customer_id로 나중에 연결 가능
  console.log("Saving purchase from webhook as backup:", data.order_id);

  // product_id로 코스 또는 플랜 조회
  if (data.product_id) {
    // 먼저 코스 테이블에서 매칭 확인
    const { data: course } = await supabase
      .from("courses")
      .select("id, price, currency")
      .eq("creem_product_id", data.product_id)
      .single();

    if (course) {
      // course_purchases 중복 체크
      const { data: existingCoursePurchase } = await supabase
        .from("course_purchases")
        .select("id")
        .eq("creem_order_id", data.order_id)
        .single();

      if (!existingCoursePurchase) {
        await supabase.from("course_purchases").insert({
          user_id: null,
          course_id: course.id,
          creem_checkout_id: data.checkout_id,
          creem_order_id: data.order_id,
          creem_customer_id: data.customer_id,
          creem_product_id: data.product_id,
          status: "completed",
          amount: course.price,
          currency: course.currency || "USD",
        });
        console.log("Course purchase saved from webhook:", data.order_id);
      } else {
        console.log("Course purchase already exists for order:", data.order_id);
      }
      return;
    }

    // 코스가 아니면 기존 플랜 조회
    const { data: plan } = await supabase
      .from("pricing_plans")
      .select("id, price_monthly, currency")
      .eq("creem_product_id", data.product_id)
      .eq("billing_type", "onetime")
      .single();

    if (plan) {
      await supabase.from("purchases").insert({
        user_id: null,
        plan_id: plan.id,
        creem_checkout_id: data.checkout_id,
        creem_order_id: data.order_id,
        creem_customer_id: data.customer_id,
        creem_product_id: data.product_id,
        status: "completed",
        amount: plan.price_monthly,
        currency: plan.currency || "USD",
      });

      console.log("Purchase saved from webhook:", data.order_id);
    } else {
      console.log("No matching course or plan found for product:", data.product_id);
    }
  }
}
