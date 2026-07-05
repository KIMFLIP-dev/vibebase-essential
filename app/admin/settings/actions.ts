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
