"use server";

import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types/post";

export async function getPublishedPosts(): Promise<Post[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = await createClient();

  // 한글 슬러그 라운드트립 방어:
  // 일부 런타임에서 params.slug가 퍼센트 인코딩된 채로 들어오거나
  // 유니코드 정규화(NFC/NFD)가 어긋날 수 있어, 디코딩 후 NFC로 정규화한다.
  let normalized = slug;
  try {
    normalized = decodeURIComponent(slug);
  } catch {
    // 이미 디코딩된 문자열에 '%'가 포함된 경우 등 — 원본 사용
  }
  normalized = normalized.normalize("NFC");

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", normalized)
    .eq("status", "published")
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as Post;
}

// 조회수 증가 (상세 진입 시 1회 호출). 실패해도 본문 노출엔 영향 없음.
export async function incrementPostView(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("increment_post_view", { p_id: id });
}
