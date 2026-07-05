"use client";

import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import type { CourseWithChapters } from "@/lib/types/course";

interface CoursePurchaseButtonProps {
  course: CourseWithChapters;
  purchased: boolean;
  isLoggedIn: boolean;
  hasSourceCode?: boolean;
}

export function CoursePurchaseButton({
  course,
  purchased,
  isLoggedIn,
  hasSourceCode = false,
}: CoursePurchaseButtonProps) {
  const router = useRouter();

  const firstLesson = course.chapters?.[0]?.lessons?.[0];

  if (course.is_coming_soon) {
    return (
      <button
        disabled
        className="w-full px-6 py-3 bg-[#111]/10 text-[#111]/50 rounded-full font-bold text-sm cursor-not-allowed"
      >
        준비중
      </button>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => router.push("/auth/login")}
          className="flex-1 px-6 py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-105 transition-transform cursor-pointer"
        >
          로그인 후 구매
        </button>
        {hasSourceCode && (
          <button
            disabled
            className="px-5 py-3 bg-white border border-[#111] text-[#111] rounded-full font-bold text-sm opacity-50 cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            소스코드 다운로드
          </button>
        )}
      </div>
    );
  }

  if (purchased) {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (firstLesson) {
              router.push(`/courses/${course.slug}/lessons/${firstLesson.id}`);
            }
          }}
          className="flex-1 px-6 py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-105 transition-transform cursor-pointer"
        >
          수강 시작하기
        </button>
        {hasSourceCode && (
          <a
            href={`/api/courses/${course.slug}/source-code`}
            className="px-5 py-3 bg-white border border-[#111] text-[#111] rounded-full font-bold text-sm hover:scale-105 transition-transform inline-flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            소스코드 다운로드
          </a>
        )}
      </div>
    );
  }

  const formattedPrice =
    course.price > 0 ? `₩${course.price.toLocaleString()}` : "무료";

  const hasDiscount =
    course.original_price != null &&
    course.original_price > course.price &&
    course.price > 0;

  return (
    <div className="space-y-2">
      {hasDiscount && (
        <div className="flex items-center gap-2 sm:justify-end">
          <span className="text-sm text-gray-400 line-through">
            ₩{course.original_price!.toLocaleString()}
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#B7B2FF] text-white">
            {Math.round((1 - course.price / course.original_price!) * 100)}% 할인
          </span>
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => router.push(`/courses/${course.slug}/checkout`)}
          className="flex-1 px-6 py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-105 transition-transform cursor-pointer"
        >
          {`${formattedPrice} 구매하기`}
        </button>
        {hasSourceCode && (
          <button
            disabled
            className="px-5 py-3 bg-white border border-[#111] text-[#111] rounded-full font-bold text-sm opacity-50 cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            소스코드 다운로드
          </button>
        )}
      </div>
    </div>
  );
}
