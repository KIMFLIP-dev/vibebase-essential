import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// site_settings 기반 공지 배너 — 어드민 설정에서 on/off·문구·링크 관리.
// 공개 키 화이트리스트 RLS로 비로그인에게도 조회된다.
export async function AnnouncementBanner() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["announcement_enabled", "announcement_text", "announcement_link"]);

  const settings = new Map((data ?? []).map((row) => [row.key, row.value]));

  const enabled = settings.get("announcement_enabled") === "true";
  const text = settings.get("announcement_text")?.trim();
  if (!enabled || !text) {
    return null;
  }

  const link = settings.get("announcement_link")?.trim();
  // 내부 경로 또는 https 링크만 허용 — //host 형태(protocol-relative)는 외부
  // 이동이 가능하므로 차단한다
  const isInternal = !!link && link.startsWith("/") && !link.startsWith("//");
  const safeLink =
    link && (isInternal || link.startsWith("https://")) ? link : null;

  const content = (
    <span className="text-xs md:text-sm font-bold text-white">
      📢 {text}
      {safeLink && <span className="ml-1.5 underline">자세히 보기</span>}
    </span>
  );

  return (
    <div className="w-full bg-[#111] text-center px-4 py-2.5">
      {safeLink ? (
        <Link href={safeLink} className="hover:opacity-80 transition-opacity">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
