"use server";

import { createClient } from "@/lib/supabase/server";
import type { DownloadItem } from "@/lib/types/download";

export async function getPublishedDownloads(): Promise<DownloadItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("download_items")
    .select("*")
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DownloadItem[];
}
