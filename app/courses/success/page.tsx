"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function CourseSuccessContent() {
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");
  const courseSlug = searchParams.get("courseSlug");
  const courseTitle = searchParams.get("courseTitle");
  const amount = searchParams.get("amount");

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-[#111] p-8 text-center">
        <div className="w-16 h-16 bg-[#B7B2FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-xl font-black text-[#111] mb-2">구매 완료!</h2>
        <p className="text-sm text-gray-500 mb-6">
          수강을 시작하세요. 구매해 주셔서 감사합니다.
        </p>

        {(courseTitle || orderId || amount) && (
          <div className="bg-[#F9F9FB] rounded-xl p-4 text-sm space-y-2 mb-6 text-left">
            {courseTitle && (
              <div className="flex justify-between">
                <span className="text-gray-500">강좌명</span>
                <span className="font-bold text-[#111]">{courseTitle}</span>
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
          {courseSlug ? (
            <>
              <Link
                href={`/courses/${courseSlug}`}
                className="w-full py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer text-center"
              >
                수강 시작하기
              </Link>
              <Link
                href="/mypage/courses"
                className="w-full py-3 bg-white border border-[#111] text-[#111] rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer text-center"
              >
                내 강좌 보기
              </Link>
            </>
          ) : (
            <Link
              href="/courses"
              className="w-full py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer text-center"
            >
              강좌 목록으로
            </Link>
          )}
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

export default function CourseSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CourseSuccessContent />
    </Suspense>
  );
}
