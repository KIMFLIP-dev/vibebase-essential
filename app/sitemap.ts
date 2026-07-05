import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// 공개 페이지 + 발행된 블로그 글/상품을 포함한 동적 사이트맵
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/download`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // env 미설정(초기 셋업) 시에도 사이트맵 자체는 동작한다
  if (!supabaseUrl || !supabaseKey) {
    return staticRoutes;
  }

  try {
    // 쿠키 없는 공개 조회 — RLS의 published 정책으로 필터링된다
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // PostgREST 기본 max-rows(1000)에서 조용히 잘리지 않도록
    // 결정적 정렬 + 명시적 상한을 둔다 (초과 규모는 sitemap index 분할 필요)
    const [{ data: posts }, { data: products }] = await Promise.all([
      supabase
        .from("posts")
        .select("slug, updated_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(1000),
      supabase
        .from("products")
        .select("slug, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(1000),
    ]);

    const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
      url: `${siteUrl}/blog/${encodeURIComponent(post.slug)}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map(
      (product) => ({
        url: `${siteUrl}/products/${encodeURIComponent(product.slug)}`,
        lastModified: product.updated_at
          ? new Date(product.updated_at)
          : undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    );

    return [...staticRoutes, ...postRoutes, ...productRoutes];
  } catch (error) {
    console.error("[sitemap] 동적 경로 조회 실패:", error);
    return staticRoutes;
  }
}
