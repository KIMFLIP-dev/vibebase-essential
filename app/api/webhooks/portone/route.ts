import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getPayment } from "@/lib/portone/client";

// 포트원 V2 웹훅 이벤트 타입
interface PortOneWebhookEvent {
  type: string;
  timestamp: string;
  data: {
    paymentId: string;
    transactionId?: string;
    cancellationId?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PortOneWebhookEvent = await request.json();
    const { type: eventType, data } = body;

    console.log(`[포트원 웹훅] 이벤트: ${eventType}, paymentId: ${data.paymentId}`);

    const adminClient = createAdminClient();

    switch (eventType) {
      case "Transaction.Paid": {
        const { paymentId } = data;

        // 이미 처리된 결제인지 확인
        const { data: existing } = await adminClient
          .from("course_purchases")
          .select("id")
          .eq("toss_payment_key", paymentId)
          .single();

        if (existing) {
          console.log(`[포트원 웹훅] 이미 처리된 결제: ${paymentId}`);
          break;
        }

        // 포트원 API로 결제 정보 조회
        const payment = await getPayment(paymentId);

        if (payment.status !== "PAID") {
          console.log(`[포트원 웹훅] 결제 미완료 상태: ${payment.status}`);
          break;
        }

        // pending_orders에서 매칭되는 주문 조회
        // customData에 orderId를 넣지 않았으므로, paymentId 기반으로 처리
        // 우리 시스템에서는 pending_orders를 orderId로 관리하므로
        // toss_payment_key(=paymentId)로 이미 저장됐는지만 체크하고,
        // 아직 미처리인 pending_order를 찾아서 처리
        const { data: pendingOrders } = await adminClient
          .from("pending_orders")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        // pending_orders 중 금액이 일치하는 것을 찾아 처리
        // (success 페이지에서 처리 실패한 경우의 fallback)
        if (pendingOrders && pendingOrders.length > 0) {
          for (const pendingOrder of pendingOrders) {
            if (Number(pendingOrder.amount) === payment.amount.total) {
              await adminClient.from("course_purchases").insert({
                user_id: pendingOrder.user_id,
                course_id: pendingOrder.course_id,
                toss_order_id: pendingOrder.order_id,
                toss_payment_key: paymentId,
                status: "completed",
                amount: payment.amount.total,
                currency: payment.currency || "KRW",
                payment_method: payment.method?.type || null,
              });

              await adminClient
                .from("pending_orders")
                .update({ status: "completed" })
                .eq("order_id", pendingOrder.order_id);

              console.log(`[포트원 웹훅] 결제 완료 처리: ${pendingOrder.order_id}`);
              break;
            }
          }
        }
        break;
      }

      case "Transaction.Cancelled": {
        const { paymentId } = data;

        const payment = await getPayment(paymentId);
        const cancelAmount = payment.cancellations?.reduce(
          (sum, c) => sum + c.totalAmount,
          0
        ) || 0;

        const isFullCancel = payment.amount.cancelled >= payment.amount.total;

        await adminClient
          .from("course_purchases")
          .update({
            status: isFullCancel ? "refunded" : "completed",
            is_refunded: isFullCancel,
            refunded_amount: cancelAmount,
            refunded_at: isFullCancel ? new Date().toISOString() : null,
          })
          .eq("toss_payment_key", paymentId);

        console.log(
          `[포트원 웹훅] 결제 ${isFullCancel ? "전액" : "부분"} 취소: ${paymentId}, 취소금액: ${cancelAmount}`
        );
        break;
      }

      default:
        console.log(`[포트원 웹훅] 처리하지 않는 이벤트: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[포트원 웹훅] 처리 오류:", error);
    return NextResponse.json({ success: true });
  }
}
