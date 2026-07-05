import type { Metadata } from "next";
import { NavbarNew } from "@/components/common_new/navbar";
import { FooterNew } from "@/components/landing/footer";
import { PostCard } from "@/components/blog/post-card";
import { getPublishedPosts } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "블로그 | VibeBase",
  description: "바이브코딩과 1인 SaaS 런칭에 대한 이야기. 김플립의 VibeBase 블로그.",
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9FB] font-sans">
      <NavbarNew />

      <main className="flex-1 pt-36 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          {/* 헤더 */}
          <div className="text-left mb-16">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111] mb-4">
              <span className="inline-block px-5 py-1 bg-[#B7B2FF] text-white rounded-full italic mr-2">
                VibeBase
              </span>
              블로그
            </h1>
            <p className="text-lg text-[#111] font-bold mt-3 ml-[10px]">
              바이브코딩, 1인 SaaS, 그리고 삽질의 기록. 유튜브에 다 못 담은 이야기들 여기 풀어둠.
            </p>
          </div>

          {/* 글 목록 */}
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#111] p-12 text-center">
              <p className="text-lg font-bold text-[#111]">아직 발행된 글이 없습니다.</p>
              <p className="text-sm text-gray-600 mt-2">곧 좋은 글로 찾아올게요.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>

      <FooterNew />
    </div>
  );
}
