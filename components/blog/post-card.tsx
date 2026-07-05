import Link from "next/link";
import type { Post } from "@/lib/types/post";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col sm:flex-row bg-white rounded-2xl border border-[#111] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* 썸네일 (왼쪽) */}
      <div className="sm:w-60 sm:shrink-0 aspect-video sm:aspect-auto bg-gray-100 overflow-hidden">
        {post.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full min-h-[160px] bg-[#B7B2FF]/20 flex items-center justify-center">
            <span className="text-2xl font-black italic text-[#B7B2FF]">VibeBase</span>
          </div>
        )}
      </div>

      {/* 내용 (오른쪽) */}
      <div className="flex-1 min-w-0 p-6 sm:p-7 flex flex-col">
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs font-bold text-white bg-[#B7B2FF] rounded-full px-2.5 py-0.5"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#111] leading-snug line-clamp-2">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-gray-400 font-medium">
          <span>{formatDate(post.published_at)}</span>
          <span>·</span>
          <span>조회 {(post.view_count ?? 0).toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}
