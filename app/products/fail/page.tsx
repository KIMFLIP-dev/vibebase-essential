"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function PurchaseFailContent() {
  const searchParams = useSearchParams();

  const code = searchParams.get("code") || "UNKNOWN_ERROR";
  const message =
    searchParams.get("message") || "결제 처리 중 오류가 발생했습니다.";
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-[#111] p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-[#111] mb-2">결제 실패</h2>
        <p className="text-sm text-red-500 mb-6">{message}</p>

        <div className="bg-[#F9F9FB] rounded-xl p-4 text-sm space-y-2 mb-6 text-left">
          <div className="flex justify-between">
            <span className="text-gray-500">오류 코드</span>
            <span className="font-mono text-xs text-[#111]">{code}</span>
          </div>
          {orderId && (
            <div className="flex justify-between">
              <span className="text-gray-500">주문 번호</span>
              <span className="font-mono text-xs text-[#111]">{orderId}</span>
            </div>
          )}
        </div>

        <Link
          href="/products"
          className="w-full inline-block py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer text-center"
        >
          상품 목록으로 돌아가기
        </Link>
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
      </div>
    </div>
  );
}

export default function PurchaseFailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PurchaseFailContent />
    </Suspense>
  );
}
