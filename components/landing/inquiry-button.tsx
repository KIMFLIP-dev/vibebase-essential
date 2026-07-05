"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getInquiryEligibility } from "@/app/courses/actions";

const KAKAO_INQUIRY_URL = "http://pf.kakao.com/_xezKzX";

interface InquiryButtonProps {
  redirectTo?: string;
  className?: string;
}

export function InquiryButton({
  redirectTo = "/",
  className = "inline-flex items-center gap-2 px-10 py-5 bg-white border border-[#111] text-[#111] rounded-full font-bold text-lg hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100",
}: InquiryButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleInquiry = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { loggedIn, hasPaidCourse } = await getInquiryEligibility();

      if (!loggedIn) {
        toast.info("로그인이 필요합니다.", {
          description: "1:1 문의는 수강생 전용입니다. 먼저 로그인해 주세요.",
        });
        router.push(`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
        return;
      }

      if (!hasPaidCourse) {
        toast.error("수강생 전용 기능입니다.", {
          description: "유료 강좌를 수강 중인 분만 1:1 문의를 이용할 수 있어요.",
        });
        return;
      }

      window.open(KAKAO_INQUIRY_URL, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleInquiry}
      disabled={loading}
      className={className}
    >
      <span className="w-8 h-8 border border-[#111] rounded-full flex items-center justify-center flex-shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#111">
          <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.037 5.906l-.857 3.2a.5.5 0 0 0 .77.527l3.96-2.473c.69.1 1.392.15 2.09.15 5.523 0 10-3.477 10-7.81C22 6.477 17.523 3 12 3z" />
        </svg>
      </span>
      {loading ? "확인 중..." : "더 궁금한점 1:1 문의"}
    </button>
  );
}
