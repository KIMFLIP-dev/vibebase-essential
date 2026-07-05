"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { saveSubscription } from "../actions";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const planId = searchParams.get("plan");
  const period = searchParams.get("period");
  const checkoutId = searchParams.get("checkout_id");
  const orderId = searchParams.get("order_id");
  const customerId = searchParams.get("customer_id");
  const subscriptionId = searchParams.get("subscription_id");
  const productId = searchParams.get("product_id");

  useEffect(() => {
    async function processSubscription() {
      if (!planId || !checkoutId || !orderId || !customerId || !subscriptionId || !productId) {
        setError("필수 결제 정보가 누락되었습니다.");
        setStatus("error");
        return;
      }

      try {
        const result = await saveSubscription({
          planId,
          period: period || "monthly",
          checkoutId,
          orderId,
          customerId,
          subscriptionId,
          productId,
        });

        if (result.success) {
          setStatus("success");
        } else {
          setError(result.error || "구독 처리 중 오류가 발생했습니다.");
          setStatus("error");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
        setStatus("error");
      }
    }

    processSubscription();
  }, [planId, period, checkoutId, orderId, customerId, subscriptionId, productId]);

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-[#111] p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 text-[#B7B2FF] animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-black text-[#111] mb-2">결제 처리 중...</h2>
            <p className="text-sm text-gray-500">잠시만 기다려주세요.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-[#B7B2FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-black text-[#111] mb-2">결제가 완료되었습니다!</h2>
            <p className="text-sm text-gray-500 mb-6">구독이 성공적으로 활성화되었습니다.</p>

            <div className="bg-[#F9F9FB] rounded-xl p-4 text-sm space-y-2 mb-6 text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">결제 주기</span>
                <span className="font-bold text-[#111]">
                  {period === "yearly" ? "연간 결제" : "월간 결제"}
                </span>
              </div>
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">주문 번호</span>
                  <span className="font-mono text-xs text-[#111]">{orderId}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/mypage"
                className="w-full py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer text-center"
              >
                서비스 시작하기
              </Link>
              <Link
                href="/mypage/subscription"
                className="w-full py-3 bg-white border border-[#111] text-[#111] rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer text-center"
              >
                구독 관리
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-[#111] mb-2">결제 처리 오류</h2>
            <p className="text-sm text-red-500 mb-6">{error}</p>
            <Link
              href="/pricing"
              className="w-full inline-block py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer text-center"
            >
              가격 페이지로 돌아가기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <Loader2 className="h-12 w-12 text-[#B7B2FF] animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-black text-[#111]">로딩 중...</h2>
        <p className="text-sm text-gray-500 mt-2">결제 정보를 불러오고 있습니다.</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
