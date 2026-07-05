"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";
import type { DownloadItem, DownloadItemInput } from "@/lib/types/download";

const DOWNLOAD_BUCKET = "download-files";

export async function getAdminDownloads(): Promise<DownloadItem[]> {
  await requireAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("download_items")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DownloadItem[];
}

export async function getAdminDownload(id: string): Promise<DownloadItem | null> {
  await requireAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("download_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as DownloadItem;
}

function validateInput(input: DownloadItemInput, requireActions: boolean) {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error("제목을 입력해주세요.");
  }
  if (input.is_paid && (!input.price || input.price <= 0)) {
    throw new Error("유료 카드는 가격을 1원 이상 입력해주세요.");
  }
  if (input.card_variant && !["light", "dark"].includes(input.card_variant)) {
    throw new Error("카드 색상은 light 또는 dark만 가능합니다.");
  }
  if (requireActions) {
    const hasGithub = !!input.github_url?.trim();
    if (!hasGithub) {
      throw new Error(
        "GitHub URL 또는 파일 중 최소 하나는 필요합니다. 카드 생성 후 편집 페이지에서 파일을 업로드하면 GitHub URL은 비워두어도 됩니다."
      );
    }
  }
}

export async function createDownload(input: DownloadItemInput): Promise<DownloadItem> {
  await requireAdmin();
  validateInput(input, true);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("download_items")
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      badge_label: input.badge_label?.trim() || "소스코드",
      github_url: input.github_url?.trim() || null,
      youtube_url: input.youtube_url?.trim() || null,
      is_paid: input.is_paid ?? false,
      price: input.price ?? 0,
      currency: input.currency || "KRW",
      card_variant: input.card_variant || (input.is_paid ? "dark" : "light"),
      display_order: input.display_order ?? 0,
      is_published: input.is_published ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/downloads");
  revalidatePath("/download");

  return data as DownloadItem;
}

export async function updateDownload(
  id: string,
  input: DownloadItemInput
): Promise<DownloadItem> {
  await requireAdmin();
  validateInput(input, false);

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.badge_label !== undefined)
    updateData.badge_label = input.badge_label?.trim() || "소스코드";
  if (input.github_url !== undefined) updateData.github_url = input.github_url?.trim() || null;
  if (input.youtube_url !== undefined) updateData.youtube_url = input.youtube_url?.trim() || null;
  if (input.is_paid !== undefined) updateData.is_paid = input.is_paid;
  if (input.price !== undefined) updateData.price = input.price;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.card_variant !== undefined) updateData.card_variant = input.card_variant;
  if (input.display_order !== undefined) updateData.display_order = input.display_order;
  if (input.is_published !== undefined) updateData.is_published = input.is_published;

  const { data, error } = await supabase
    .from("download_items")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/downloads");
  revalidatePath(`/admin/downloads/${id}`);
  revalidatePath("/download");

  return data as DownloadItem;
}

export async function deleteDownload(id: string): Promise<void> {
  await requireAdmin();

  const adminClient = createAdminClient();
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("download_items")
    .select("file_path")
    .eq("id", id)
    .single();

  if (item?.file_path) {
    await adminClient.storage.from(DOWNLOAD_BUCKET).remove([item.file_path]);
  }

  const { error } = await supabase.from("download_items").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/downloads");
  revalidatePath("/download");
}

export async function toggleDownloadPublished(id: string): Promise<DownloadItem> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("download_items")
    .select("is_published")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const { data, error } = await supabase
    .from("download_items")
    .update({ is_published: !current.is_published })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/downloads");
  revalidatePath("/download");

  return data as DownloadItem;
}

export async function uploadDownloadFile(
  id: string,
  formData: FormData
): Promise<{ file_path: string; file_name: string }> {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new Error("파일을 선택해주세요.");
  }

  const adminClient = createAdminClient();
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("download_items")
    .select("file_path")
    .eq("id", id)
    .single();

  if (item?.file_path) {
    await adminClient.storage.from(DOWNLOAD_BUCKET).remove([item.file_path]);
  }

  const storagePath = `${id}/${file.name}`;

  const { error: uploadError } = await adminClient.storage
    .from(DOWNLOAD_BUCKET)
    .upload(storagePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(`파일 업로드 실패: ${uploadError.message}`);
  }

  const { error: updateError } = await adminClient
    .from("download_items")
    .update({ file_path: storagePath, file_name: file.name })
    .eq("id", id);

  if (updateError) {
    throw new Error(`DB 업데이트 실패: ${updateError.message}`);
  }

  revalidatePath("/admin/downloads");
  revalidatePath(`/admin/downloads/${id}`);
  revalidatePath("/download");

  return { file_path: storagePath, file_name: file.name };
}

export async function deleteDownloadFile(id: string): Promise<void> {
  await requireAdmin();

  const adminClient = createAdminClient();
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("download_items")
    .select("file_path")
    .eq("id", id)
    .single();

  if (item?.file_path) {
    await adminClient.storage.from(DOWNLOAD_BUCKET).remove([item.file_path]);
  }

  const { error: updateError } = await adminClient
    .from("download_items")
    .update({ file_path: null, file_name: null })
    .eq("id", id);

  if (updateError) {
    throw new Error(`DB 업데이트 실패: ${updateError.message}`);
  }

  revalidatePath("/admin/downloads");
  revalidatePath(`/admin/downloads/${id}`);
  revalidatePath("/download");
}
