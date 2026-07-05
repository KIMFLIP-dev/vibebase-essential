"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";
import type { Product, ProductInput } from "@/lib/types/product";

function slugify(input: string): string {
  const slug = input
    .normalize("NFC") // 한글 슬러그 일관성 (저장/조회 모두 NFC)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `product-${Date.now()}`;
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
  while (n < 50) {
    let query = supabase.from("products").select("id").eq("slug", candidate);
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    const { data } = await query.limit(1).maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

function validateInput(input: ProductInput) {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("상품명을 입력해주세요.");
  }
  const price = Number(input.price ?? 0);
  if (Number.isNaN(price) || price < 0) {
    throw new Error("가격은 0원 이상이어야 합니다.");
  }
  if (input.original_price != null) {
    const original = Number(input.original_price);
    if (Number.isNaN(original) || original < 0) {
      throw new Error("정가는 0원 이상이어야 합니다.");
    }
    if (original > 0 && original <= price) {
      throw new Error("정가는 판매가보다 커야 합니다.");
    }
  }
}

export async function getAdminProducts(): Promise<Product[]> {
  await requireAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Product[];
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  await requireAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as Product;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  await requireAdmin();
  validateInput(input);

  const supabase = await createClient();

  const base = slugify(input.slug?.trim() || input.name);
  const slug = await ensureUniqueSlug(supabase, base);

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      short_description: input.short_description?.trim() || null,
      thumbnail_url: input.thumbnail_url?.trim() || null,
      price: Number(input.price ?? 0),
      original_price:
        input.original_price != null && Number(input.original_price) > 0
          ? Number(input.original_price)
          : null,
      currency: input.currency || "KRW",
      download_url: input.download_url?.trim() || null,
      is_published: input.is_published ?? false,
      is_coming_soon: input.is_coming_soon ?? false,
      display_order: input.display_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    // 23505: ensureUniqueSlug 확인과 INSERT 사이의 동시 생성 경쟁
    if (error.code === "23505") {
      throw new Error("슬러그가 방금 사용되었습니다. 다시 시도해주세요.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return data as Product;
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<Product> {
  await requireAdmin();
  validateInput(input);

  const supabase = await createClient();

  // 슬러그가 바뀌면 이전 상세 페이지 캐시도 무효화해야 한다
  const { data: previous } = await supabase
    .from("products")
    .select("slug")
    .eq("id", id)
    .single();

  const base = slugify(input.slug?.trim() || input.name);
  const slug = await ensureUniqueSlug(supabase, base, id);

  const { data, error } = await supabase
    .from("products")
    .update({
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      short_description: input.short_description?.trim() || null,
      thumbnail_url: input.thumbnail_url?.trim() || null,
      price: Number(input.price ?? 0),
      original_price:
        input.original_price != null && Number(input.original_price) > 0
          ? Number(input.original_price)
          : null,
      currency: input.currency || "KRW",
      download_url: input.download_url?.trim() || null,
      is_published: input.is_published ?? false,
      is_coming_soon: input.is_coming_soon ?? false,
      display_order: input.display_order ?? 0,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("슬러그가 방금 사용되었습니다. 다시 시도해주세요.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  if (previous?.slug && previous.slug !== slug) {
    revalidatePath(`/products/${previous.slug}`);
  }
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: previous } = await supabase
    .from("products")
    .select("slug")
    .eq("id", id)
    .single();

  // 구매 기록은 FK ON DELETE SET NULL + product_name 스냅샷으로 보존된다
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  if (previous?.slug) {
    revalidatePath(`/products/${previous.slug}`);
  }
}
