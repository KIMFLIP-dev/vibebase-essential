import { redirect } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyInquiries } from "@/app/mypage/inquiries/actions";
import { MessageCircle, Plus, CornerDownRight } from "lucide-react";
import type { InquiryStatus } from "@/lib/types/inquiry";

function getStatusBadge(status: InquiryStatus) {
  switch (status) {
    case "open":
      return { text: "답변 대기", style: "bg-gray-100 text-gray-600" };
    case "answered":
      return { text: "답변 완료", style: "bg-[#B7B2FF]/20 text-[#111]" };
    case "closed":
      return { text: "종료", style: "bg-gray-100 text-gray-400" };
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MyInquiriesPage() {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const inquiries = await getMyInquiries();

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#111] flex items-center gap-3">
            <MessageCircle className="h-7 w-7" />
            1:1 문의
          </h1>
          <p className="text-gray-500 mt-2">문의를 남기면 답변을 드립니다.</p>
        </div>
        <Link
          href="/mypage/inquiries/new"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#111] text-white rounded-full font-bold text-sm hover:bg-[#B7B2FF] transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          문의하기
        </Link>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#111] p-12 text-center">
          <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">등록된 문의가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => {
            const badge = getStatusBadge(inquiry.status);
            return (
              <div
                key={inquiry.id}
                className="bg-white rounded-2xl border border-[#111] p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-bold text-[#111]">{inquiry.title}</h3>
                  <span
                    className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${badge.style}`}
                  >
                    {badge.text}
                  </span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {inquiry.message}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {formatDate(inquiry.created_at)}
                </p>

                {inquiry.answer && (
                  <div className="mt-4 bg-[#F9F9FB] rounded-xl p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#111] mb-2">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      답변
                      {inquiry.answered_at && (
                        <span className="font-normal text-gray-400">
                          · {formatDate(inquiry.answered_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {inquiry.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
