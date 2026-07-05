"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Inquiry } from "@/lib/types/inquiry";

// 내 문의 목록
export async function getMyInquiries(): Promise<Inquiry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("문의 목록 조회 오류:", error);
    return [];
  }

  return (data || []) as Inquiry[];
}

// 문의 작성 (RLS insert_own 정책으로 본인 명의만 가능)
export async function createInquiry(input: {
  title: string;
  message: string;
}): Promise<{ error?: string }> {
  const title = input.title?.trim();
  const message = input.message?.trim();

  if (!title || !message) {
    return { error: "제목과 내용을 입력해주세요." };
  }
  if (title.length > 200) {
    return { error: "제목은 200자 이내로 입력해주세요." };
  }
  if (message.length > 5000) {
    return { error: "내용은 5,000자 이내로 입력해주세요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("inquiries").insert({
    user_id: user.id,
    title,
    message,
  });

  if (error) {
    console.error("문의 작성 오류:", error);
    return { error: "문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/mypage/inquiries");
  return {};
}
