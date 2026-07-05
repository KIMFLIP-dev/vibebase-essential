import { NavbarNew } from "@/components/common/navbar";
import { FooterNew } from "@/components/landing/footer";
import { DownloadCard } from "@/components/download/download-card";
import { getPublishedDownloads } from "./actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DownloadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  const items = await getPublishedDownloads();

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9FB] font-sans">
      <NavbarNew />

      <main className="flex-1 pt-36 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-left mb-16">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111] mb-4">
              <span className="inline-block px-5 py-1 bg-[#B7B2FF] text-white rounded-full italic mr-2">
                VibeBase
              </span>
              다운로드
            </h1>
            <p className="text-lg text-[#111] font-bold mt-3 ml-[10px]">
              영상에서 나왔던 소스코드, 프롬프트 모음, MD 파일 등을 이곳에서 무료 다운로드 하실수 있습니다.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#111] p-12 text-center">
              <p className="text-lg font-bold text-[#111]">
                등록된 다운로드 카드가 없습니다.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                관리자 페이지에서 새 카드를 추가해주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <DownloadCard
                  key={item.id}
                  item={item}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <FooterNew />
    </div>
  );
}
