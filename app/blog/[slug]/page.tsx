import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NavbarNew } from "@/components/common_new/navbar";
import { FooterNew } from "@/components/landing/footer";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { getPostBySlug, incrementPostView } from "../actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "글을 찾을 수 없습니다 | VibeBase" };
  }

  return {
    title: `${post.title} | VibeBase 블로그`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // 조회수 증가 (본문 렌더와 무관하게 1회)
  await incrementPostView(post.id);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9FB] font-sans">
      <NavbarNew />

      <main className="flex-1 pt-32 pb-24 px-6 md:pt-40">
        <article className="max-w-3xl mx-auto">
          {/* 헤더 */}
          <header className="mb-10">
            <Link
              href="/blog"
              className="inline-block text-sm font-bold text-gray-500 hover:text-[#111] mb-6 transition-colors"
            >
              ← 블로그 목록
            </Link>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-bold text-white bg-[#B7B2FF] rounded-full px-2.5 py-0.5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111] leading-tight mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-3 text-sm text-gray-400 font-medium">
              <span>{formatDate(post.published_at)}</span>
              <span>·</span>
              <span>조회 {(post.view_count ?? 0).toLocaleString()}</span>
            </div>
          </header>

          {post.cover_image_url && (
            <div className="mb-10 rounded-2xl overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* 본문 */}
          <MarkdownContent content={post.content_md} />
        </article>
      </main>

      <FooterNew />
    </div>
  );
}
