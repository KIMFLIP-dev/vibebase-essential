"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { createInquiry } from "@/app/mypage/inquiries/actions";

export default function NewInquiryPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await createInquiry({ title, message });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    toast.success("문의가 접수되었습니다.");
    router.push("/mypage/inquiries");
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <Link
        href="/mypage/inquiries"
        className="inline-flex items-center gap-1 text-sm font-bold text-[#111] hover:text-[#B7B2FF] transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        문의 목록으로
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#111] flex items-center gap-3">
          <MessageCircle className="h-7 w-7" />
          문의하기
        </h1>
        <p className="text-gray-500 mt-2">궁금한 점을 남겨주세요.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#111] p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-bold text-[#111]">
              제목
            </label>
            <Input
              id="title"
              type="text"
              placeholder="문의 제목을 입력하세요"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-xl border-[#111]/20 focus:border-[#B7B2FF] focus:ring-[#B7B2FF]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="message" className="text-sm font-bold text-[#111]">
              내용
            </label>
            <Textarea
              id="message"
              placeholder="문의 내용을 자세히 적어주세요"
              required
              rows={8}
              maxLength={5000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl border-[#111]/20 focus:border-[#B7B2FF] focus:ring-[#B7B2FF] resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl p-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-[1.02] transition-transform cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                접수 중...
              </span>
            ) : (
              "문의 접수"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
