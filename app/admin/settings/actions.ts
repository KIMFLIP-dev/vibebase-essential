"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireSuperAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";
import type { SiteSetting } from "@/lib/types/admin";

export async function getSiteName(): Promise<string> {
  await requireAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site_name")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return "My Website";
    }
    throw new Error(error.message);
  }

  return data?.value || "My Website";
}

export async function updateSiteName(name: string): Promise<SiteSetting> {
  await requireSuperAdmin();

  if (!name || name.trim().length === 0) {
    throw new Error("웹사이트명을 입력해주세요.");
  }

  if (name.length > 100) {
    throw new Error("웹사이트명은 100자 이하로 입력해주세요.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      {
        key: "site_name",
        value: name.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/settings");

  return data as SiteSetting;
}

export interface AnnouncementSettings {
  enabled: boolean;
  text: string;
  link: string;
}

export async function getAnnouncementSettings(): Promise<AnnouncementSettings> {
  await requireAdmin();

  const supabase = await createClient();

  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["announcement_enabled", "announcement_text", "announcement_link"]);

  const settings = new Map((data ?? []).map((row) => [row.key, row.value]));

  return {
    enabled: settings.get("announcement_enabled") === "true",
    text: settings.get("announcement_text") ?? "",
    link: settings.get("announcement_link") ?? "",
  };
}

export async function updateAnnouncementSettings(
  input: AnnouncementSettings
): Promise<void> {
  await requireSuperAdmin();

  const text = input.text?.trim() ?? "";
  const link = input.link?.trim() ?? "";

  if (input.enabled && !text) {
    throw new Error("배너를 켜려면 공지 문구를 입력해주세요.");
  }
  if (text.length > 200) {
    throw new Error("공지 문구는 200자 이하로 입력해주세요.");
  }
  const isInternal = link.startsWith("/") && !link.startsWith("//");
  if (link && !isInternal && !link.startsWith("https://")) {
    throw new Error("링크는 내부 경로(/...) 또는 https:// URL만 가능합니다.");
  }

  const supabase = await createClient();

  const rows = [
    { key: "announcement_enabled", value: String(input.enabled) },
    { key: "announcement_text", value: text },
    { key: "announcement_link", value: link },
  ].map((row) => ({ ...row, updated_at: new Date().toISOString() }));

  const { error } = await supabase
    .from("site_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
