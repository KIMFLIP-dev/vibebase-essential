"use client";

import { useState } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { confirmAndSavePurchase } from "@/app/products/actions";

interface PortOnePaymentWidgetProps {
  paymentId: string;
  orderId: string;
  orderName: string;
  amount: number;
  productSlug: string;
  customerEmail?: string;
  customerName?: string;
  customerPhoneNumber?: string;
}

const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID!;
const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!;

export function PortOnePaymentWidget({
  paymentId,
  orderId,
  orderName,
  amount,
  productSlug,
  customerEmail,
  customerName,
  customerPhoneNumber,
}: PortOnePaymentWidgetProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handlePayment() {
    setLoading(true);

    const requestParams = {
      storeId,
      channelKey,
      paymentId,
      orderName,
      totalAmount: Math.round(Number(amount)),
      currency: "KRW" as const,
      payMethod: "EASY_PAY" as const,
      // 웹훅에서 주문을 정확히 매칭하기 위해 orderId를 결제에 심는다
      customData: { orderId },
      customer: {
        ...(customerName && { fullName: customerName }),
        ...(customerPhoneNumber && { phoneNumber: customerPhoneNumber }),
        ...(customerEmail && { email: customerEmail }),
      },
    };

    try {
      const response = await PortOne.requestPayment(requestParams);

      if (!response || response.code !== undefined) {
        // 결제 실패 또는 사용자 취소
        const code = response?.code || "USER_CANCELLED";
        const message = response?.message || "결제가 취소되었습니다.";

        if (code === "PORTONE_BROWSER_SDK_PG_FAIL") {
          // 사용자 취소 또는 PG 실패 — 사유를 알리고 재시도 가능하게 둔다
          toast.error(message);
          setLoading(false);
          return;
        }

        router.push(
          `/products/fail?code=${encodeURIComponent(code)}&message=${encodeURIComponent(message)}&orderId=${encodeURIComponent(orderId)}`
        );
        return;
      }

      // 결제 성공 → 서버에서 검증 + DB 저장
      const result = await confirmAndSavePurchase(paymentId, orderId);

      if (result.success) {
        router.push(
          `/products/success?orderId=${encodeURIComponent(orderId)}&productSlug=${encodeURIComponent(result.productSlug || productSlug)}&productName=${encodeURIComponent(result.productName || orderName)}&amount=${amount}`
        );
      } else {
        router.push(
          `/products/fail?code=CONFIRM_FAILED&message=${encodeURIComponent(result.error || "결제 확인에 실패했습니다.")}&orderId=${encodeURIComponent(orderId)}`
        );
      }
    } catch (error) {
      console.error("[PortOnePaymentWidget] 결제 오류:", error);
      toast.error("결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full h-12 text-lg bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#3C1E1E] cursor-pointer"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            결제 처리중...
          </>
        ) : (
          <span className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.037 5.906l-.857 3.2a.5.5 0 0 0 .77.527l3.96-2.473c.69.1 1.392.15 2.09.15 5.523 0 10-3.477 10-7.81C22 6.477 17.523 3 12 3z"/>
            </svg>
            {amount.toLocaleString()}원 카카오페이 결제
          </span>
        )}
      </Button>
    </div>
  );
}
