"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";
import type { Post, PostInput } from "@/lib/types/post";

const BLOG_BUCKET = "blog-images";

// 슬러그 생성: 한글/영문/숫자 유지, 공백→하이픈, 그 외 제거.
// 비면 post-{timestamp} fallback.
function slugify(input: string): string {
  const slug = input
    .normalize("NFC") // 한글 슬러그 일관성 (저장/조회 모두 NFC)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `post-${Date.now()}`;
}

// UNIQUE 충돌 시 -2, -3 ... 접미를 붙여 고유 슬러그 확보
async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  excludeId?: string
): Promise<string> {
  let candidate = base;
  let n = 1;
  // 최대 50회까지만 시도 (사실상 도달 불가)
  while (n <= 50) {
    let query = supabase.from("posts").select("id").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

export async function getAdminPosts(): Promise<Post[]> {
  await requireAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Post[];
}

export async function getAdminPost(id: string): Promise<Post | null> {
  await requireAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as Post;
}

function validateInput(input: PostInput) {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error("제목을 입력해주세요.");
  }
  if (input.status && !["draft", "published"].includes(input.status)) {
    throw new Error("상태는 draft 또는 published만 가능합니다.");
  }
}

export async function createPost(input: PostInput): Promise<Post> {
  await requireAdmin();
  validateInput(input);

  const supabase = await createClient();

  const base = slugify(input.slug?.trim() || input.title);
  const slug = await ensureUniqueSlug(supabase, base);
  const status = input.status ?? "draft";

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: input.title.trim(),
      slug,
      excerpt: input.excerpt?.trim() || null,
      content_md: input.content_md ?? "",
      cover_image_url: input.cover_image_url?.trim() || null,
      tags: input.tags ?? [],
      status,
      display_order: input.display_order ?? 0,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/posts");
  revalidatePath("/blog");

  return data as Post;
}

export async function updatePost(id: string, input: PostInput): Promise<Post> {
  await requireAdmin();
  validateInput(input);

  const supabase = await createClient();

  // 현재 상태/발행시각 조회 (발행 전환 시 published_at 채우기 위함)
  const { data: current, error: fetchError } = await supabase
    .from("posts")
    .select("status, published_at")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const updateData: Record<string, unknown> = {};

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.excerpt !== undefined) updateData.excerpt = input.excerpt?.trim() || null;
  if (input.content_md !== undefined) updateData.content_md = input.content_md;
  if (input.cover_image_url !== undefined)
    updateData.cover_image_url = input.cover_image_url?.trim() || null;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.display_order !== undefined) updateData.display_order = input.display_order;

  // 슬러그: 명시적으로 넘어온 경우에만 재생성 + 중복 검사
  if (input.slug !== undefined && input.slug.trim().length > 0) {
    const base = slugify(input.slug);
    updateData.slug = await ensureUniqueSlug(supabase, base, id);
  }

  // 상태 전환 처리
  if (input.status !== undefined) {
    updateData.status = input.status;
    // draft -> published 로 처음 전환될 때 published_at 채움
    if (input.status === "published" && !current.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);

  return data as Post;
}

export async function deletePost(id: string): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();

  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
}

export async function togglePostStatus(id: string): Promise<Post> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("posts")
    .select("status, published_at")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const nextStatus = current.status === "published" ? "draft" : "published";
  const updateData: Record<string, unknown> = { status: nextStatus };
  // 처음 발행되는 경우 published_at 채움
  if (nextStatus === "published" && !current.published_at) {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("posts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);

  return data as Post;
}

// 본문/커버 이미지 업로드 → 공개 URL 반환 (blog-images 버킷)
export async function uploadPostImage(
  formData: FormData
): Promise<{ url: string }> {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new Error("이미지를 선택해주세요.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  const adminClient = createAdminClient();

  // 파일명 정리: 확장자 유지, 공백/특수문자 제거, 타임스탬프 prefix로 충돌 방지
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const safeBase = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^\p{L}\p{N}-]/gu, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  const storagePath = `images/${Date.now()}-${safeBase || "image"}.${ext}`;

  const { error: uploadError } = await adminClient.storage
    .from(BLOG_BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type });

  if (uploadError) {
    throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
  }

  const { data } = adminClient.storage.from(BLOG_BUCKET).getPublicUrl(storagePath);

  return { url: data.publicUrl };
}
