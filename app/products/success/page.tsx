"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function PurchaseSuccessContent() {
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");
  const productSlug = searchParams.get("productSlug");
  const productName = searchParams.get("productName");
  const amount = searchParams.get("amount");

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-[#111] p-8 text-center">
        <div className="w-16 h-16 bg-[#B7B2FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-black text-[#111] mb-2">구매 완료!</h2>
        <p className="text-sm text-gray-500 mb-6">
          구매해 주셔서 감사합니다. 구매 내역은 마이페이지에서 확인할 수 있습니다.
        </p>

        {(productName || orderId || amount) && (
          <div className="bg-[#F9F9FB] rounded-xl p-4 text-sm space-y-2 mb-6 text-left">
            {productName && (
              <div className="flex justify-between">
                <span className="text-gray-500">상품명</span>
                <span className="font-bold text-[#111]">{productName}</span>
              </div>
            )}
            {orderId && (
              <div className="flex justify-between">
                <span className="text-gray-500">주문 번호</span>
                <span className="font-mono text-xs text-[#111]">{orderId}</span>
              </div>
            )}
            {amount && (
              <div className="flex justify-between">
                <span className="text-gray-500">결제 금액</span>
                <span className="font-bold text-[#111]">
                  {parseInt(amount, 10).toLocaleString()}원
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {productSlug && (
            <Link
              href={`/products/${productSlug}`}
              className="w-full py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer text-center"
            >
              상품 확인하기
            </Link>
          )}
          <Link
            href="/mypage/purchases"
            className="w-full py-3 bg-white border border-[#111] text-[#111] rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer text-center"
          >
            구매 내역 보기
          </Link>
        </div>
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

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PurchaseSuccessContent />
    </Suspense>
  );
}
