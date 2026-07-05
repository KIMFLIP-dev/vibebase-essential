"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";
import type { Inquiry, InquiryStatus } from "@/lib/types/inquiry";

const PER_PAGE = 20;

export interface InquiriesListResult {
  inquiries: Inquiry[];
  total: number;
  page: number;
  perPage: number;
}

// 문의 목록 (상태 필터 + 페이지네이션, 이메일 보강)
export async function getAdminInquiries(options?: {
  statusFilter?: InquiryStatus | "all";
  page?: number;
}): Promise<InquiriesListResult> {
  await requireAdmin();

  const statusFilter = options?.statusFilter ?? "all";
  const page = Math.max(1, options?.page ?? 1);

  const adminClient = createAdminClient();

  let query = adminClient
    .from("inquiries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const inquiries = (data ?? []) as Inquiry[];

  // 작성자 이메일 보강 (페이지당 최대 20명으로 팬아웃 제한됨)
  const userIds = [...new Set(inquiries.map((inquiry) => inquiry.user_id))];
  const emailMap = new Map<string, string>();
  await Promise.all(
    userIds.map(async (userId) => {
      const { data: userData } = await adminClient.auth.admin.getUserById(userId);
      if (userData.user?.email) {
        emailMap.set(userId, userData.user.email);
      }
    })
  );

  for (const inquiry of inquiries) {
    const email = emailMap.get(inquiry.user_id);
    if (email) {
      inquiry.user = { email };
    }
  }

  return { inquiries, total: count ?? 0, page, perPage: PER_PAGE };
}

// 답변 등록 (status → answered. 종료된 문의는 되살리지 않는다)
export async function answerInquiry(
  inquiryId: string,
  answer: string
): Promise<{ error?: string }> {
  await requireAdmin();

  const trimmed = answer?.trim();
  if (!trimmed) {
    return { error: "답변 내용을 입력해주세요." };
  }

  const adminClient = createAdminClient();

  const { data: updated, error } = await adminClient
    .from("inquiries")
    .update({
      answer: trimmed,
      status: "answered",
      answered_at: new Date().toISOString(),
    })
    .eq("id", inquiryId)
    .neq("status", "closed")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[문의] 답변 저장 실패:", error);
    return { error: "답변 저장에 실패했습니다." };
  }

  if (!updated) {
    return { error: "종료된 문의에는 답변할 수 없습니다." };
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/mypage/inquiries");
  return {};
}

// 문의 종료
export async function closeInquiry(inquiryId: string): Promise<{ error?: string }> {
  await requireAdmin();

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("inquiries")
    .update({ status: "closed" })
    .eq("id", inquiryId);

  if (error) {
    return { error: "상태 변경에 실패했습니다." };
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/mypage/inquiries");
  return {};
}
