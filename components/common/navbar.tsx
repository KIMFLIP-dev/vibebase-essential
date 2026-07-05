import Link from "next/link";
import { AuthButtonNew } from "@/components/common/auth-button";
import { MobileNavNew } from "@/components/common/mobile-nav";
import { createClient } from "@/lib/supabase/server";

export async function NavbarNew() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 border border-gray-100 rounded-full px-4 py-2 bg-white/80 backdrop-blur-md hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 bg-[#B7B2FF] rounded-lg flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m16 18 6-6-6-6" />
              <path d="m8 6-6 6 6 6" />
            </svg>
          </div>
          <span className="text-xl tracking-tight text-[#111] italic">
            김플립의 <span className="font-black">VibeBase</span>
          </span>
          <span className="not-italic text-xs font-bold text-[#111] bg-[#7FFF00]/70 rounded-full px-2.5 py-1 leading-none">
            오픈준비중
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <div className="flex items-center gap-1 border border-[#111] rounded-full px-2 py-1 bg-white/80 backdrop-blur-md">
            <Link
              href="/download"
              className="text-sm font-semibold text-[#111] hover:text-[#111] transition-colors px-4 py-2 rounded-full hover:bg-[#B7B2FF] hover:text-white"
            >
              다운로드
            </Link>
            <Link
              href="/products"
              className="text-sm font-semibold text-[#111] hover:text-[#111] transition-colors px-4 py-2 rounded-full hover:bg-[#B7B2FF] hover:text-white"
            >
              상품
            </Link>
            <Link
              href="/blog"
              className="text-sm font-semibold text-[#111] hover:text-[#111] transition-colors px-4 py-2 rounded-full hover:bg-[#B7B2FF] hover:text-white"
            >
              블로그
            </Link>
            <Link
              href="/#faq"
              className="text-sm font-semibold text-[#111] hover:text-[#111] transition-colors px-4 py-2 rounded-full hover:bg-[#B7B2FF] hover:text-white"
            >
              FAQ
            </Link>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <AuthButtonNew />
          </div>
        </div>

        {/* Mobile */}
        <MobileNavNew isLoggedIn={!!user} userEmail={user?.email} />
      </div>
    </nav>
  );
}
