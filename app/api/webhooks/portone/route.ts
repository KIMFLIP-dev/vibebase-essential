import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getPayment } from "@/lib/portone/client";
import { verifyPortOneWebhook } from "@/lib/portone/webhook";
import { sendEmailToUser, getSiteUrl } from "@/lib/email/send";
import { PurchaseReceiptEmail } from "@/lib/email/templates/purchase-receipt";
import { RefundNoticeEmail } from "@/lib/email/templates/refund-notice";

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

// 결제 요청 시 customData에 넣은 orderId를 꺼낸다
function parseOrderIdFromCustomData(customData?: string): string | null {
  if (!customData) return null;
  try {
    const parsed = JSON.parse(customData);
    return typeof parsed?.orderId === "string" ? parsed.orderId : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  // 1. 서명 검증 — 위조 웹훅 차단 (검증은 raw body 기준)
  const rawBody = await request.text();
  const verification = verifyPortOneWebhook(rawBody, {
    webhookId: request.headers.get("webhook-id"),
    webhookTimestamp: request.headers.get("webhook-timestamp"),
    webhookSignature: request.headers.get("webhook-signature"),
  });

  if (!verification.valid) {
    console.warn(`[포트원 웹훅] 서명 검증 실패: ${verification.reason}`);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  try {
    const body: PortOneWebhookEvent = JSON.parse(rawBody);
    const { type: eventType, data } = body;

    console.log(`[포트원 웹훅] 이벤트: ${eventType}, paymentId: ${data.paymentId}`);

    const adminClient = createAdminClient();

    switch (eventType) {
      // 결제 완료 — 성공 페이지 처리가 실패했을 때의 fallback
      case "Transaction.Paid": {
        const { paymentId } = data;

        // 이미 처리된 결제인지 확인 (멱등)
        const { data: existing } = await adminClient
          .from("product_purchases")
          .select("id")
          .eq("portone_payment_id", paymentId)
          .maybeSingle();

        if (existing) {
          console.log(`[포트원 웹훅] 이미 처리된 결제: ${paymentId}`);
          break;
        }

        // 포트원 API로 결제 정보 조회 (webhook body를 신뢰하지 않는다)
        const payment = await getPayment(paymentId);

        if (payment.status !== "PAID") {
          console.log(`[포트원 웹훅] 결제 미완료 상태: ${payment.status}`);
          break;
        }

        // customData.orderId로 pending_order 정확 매칭
        const orderId = parseOrderIdFromCustomData(payment.customData);
        if (!orderId) {
          console.warn(
            `[포트원 웹훅] customData에 orderId 없음 — 처리 불가: ${paymentId}`
          );
          break;
        }

        const { data: pendingOrder } = await adminClient
          .from("pending_orders")
          .select("*")
          .eq("order_id", orderId)
          .maybeSingle();

        if (!pendingOrder) {
          console.warn(`[포트원 웹훅] 주문을 찾을 수 없음: ${orderId}`);
          break;
        }

        if (pendingOrder.status === "completed") {
          console.log(`[포트원 웹훅] 이미 완료된 주문: ${orderId}`);
          break;
        }

        // 금액·통화 검증 (서버 고정 금액과 대조)
        if (Number(pendingOrder.amount) !== payment.amount.total) {
          console.error(
            `[포트원 웹훅] 금액 불일치: 주문 ${pendingOrder.amount} vs 결제 ${payment.amount.total}`
          );
          break;
        }
        if (payment.currency && payment.currency !== pendingOrder.currency) {
          console.error(
            `[포트원 웹훅] 통화 불일치: 주문 ${pendingOrder.currency} vs 결제 ${payment.currency}`
          );
          break;
        }

        // 상품명 스냅샷
        const { data: product } = await adminClient
          .from("products")
          .select("name")
          .eq("id", pendingOrder.product_id)
          .single();

        const { error: insertError } = await adminClient
          .from("product_purchases")
          .insert({
            user_id: pendingOrder.user_id,
            product_id: pendingOrder.product_id,
            product_name: product?.name ?? null,
            order_id: pendingOrder.order_id,
            portone_payment_id: paymentId,
            status: "completed",
            amount: payment.amount.total,
            currency: payment.currency || "KRW",
            payment_method: payment.method?.type || null,
            receipt_url: payment.receiptUrl || null,
          });

        // 23505 = unique_violation: 검증 경로가 먼저 저장한 경우 — 정상
        if (insertError && insertError.code !== "23505") {
          console.error("[포트원 웹훅] 구매 저장 오류:", insertError);
          break;
        }

        await adminClient
          .from("pending_orders")
          .update({ status: "completed" })
          .eq("order_id", pendingOrder.order_id);

        // 이 경로에서 실제 저장된 경우에만 영수증 발송 (중복 방지)
        if (!insertError) {
          await sendEmailToUser(adminClient, pendingOrder.user_id, {
            subject: `[구매 완료] ${product?.name ?? "상품"}`,
            react: PurchaseReceiptEmail({
              productName: product?.name ?? "상품",
              amount: payment.amount.total,
              orderId: pendingOrder.order_id,
              receiptUrl: payment.receiptUrl,
              siteUrl: getSiteUrl(),
            }),
          });
        }

        console.log(`[포트원 웹훅] 결제 완료 처리: ${pendingOrder.order_id}`);
        break;
      }

      // 결제 취소(전액/부분) — 환불 상태 반영
      case "Transaction.Cancelled": {
        const { paymentId } = data;

        const payment = await getPayment(paymentId);
        const isFullCancel = payment.amount.cancelled >= payment.amount.total;
        // cancellations가 비어 오는 엣지에서 전액 취소면 총액으로 폴백 (0원 표시 방지)
        const cancelAmount =
          payment.cancellations?.reduce((sum, c) => sum + c.totalAmount, 0) ||
          (isFullCancel ? payment.amount.total : 0);

        // 환불 메일 중복 방지용: 어드민 환불 액션이 이미 반영·발송했는지 확인
        const { data: before } = await adminClient
          .from("product_purchases")
          .select("id, user_id, order_id, product_name, is_refunded")
          .eq("portone_payment_id", paymentId)
          .maybeSingle();

        const { data: updated } = await adminClient
          .from("product_purchases")
          .update({
            status: isFullCancel ? "refunded" : "completed",
            is_refunded: isFullCancel,
            refunded_amount: cancelAmount,
            refunded_at: isFullCancel ? new Date().toISOString() : null,
          })
          .eq("portone_payment_id", paymentId)
          .select("id");

        // 구매행이 아직 없으면(Paid 처리보다 취소가 먼저 도착) 재시도 유도
        if (!updated || updated.length === 0) {
          console.warn(
            `[포트원 웹훅] 취소 대상 구매 없음(이벤트 순서 경쟁 가능): ${paymentId}`
          );
          return NextResponse.json(
            { error: "purchase not found yet" },
            { status: 409 }
          );
        }

        // 외부(포트원 콘솔 등)에서 발생한 전액 취소만 여기서 메일 발송
        // (어드민 환불 액션 경로는 액션에서 이미 발송 — before.is_refunded=true)
        if (isFullCancel && before && !before.is_refunded) {
          await sendEmailToUser(adminClient, before.user_id, {
            subject: `[환불 완료] ${before.product_name ?? "상품"}`,
            react: RefundNoticeEmail({
              productName: before.product_name ?? "상품",
              refundedAmount: cancelAmount,
              orderId: before.order_id ?? "-",
            }),
          });
        }

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
    // 5xx를 반환하면 포트원이 재시도한다 — 일시 오류 복구에 유리
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
