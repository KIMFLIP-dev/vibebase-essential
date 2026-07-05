"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

interface MobileNavNewProps {
  isLoggedIn: boolean;
  userEmail?: string;
}

export function MobileNavNew({ isLoggedIn, userEmail }: MobileNavNewProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/auth/login");
  };

  const linkClass = (active?: boolean) =>
    `block text-2xl font-black text-[#111] py-2 transition-colors ${
      active ? "text-[#B7B2FF]" : "hover:text-[#B7B2FF]"
    }`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-[#F2F2F0] p-0 flex flex-col [&>button:last-child]:hidden">

        <SheetTitle className="sr-only">메뉴</SheetTitle>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-8 pb-6">
          <button
            onClick={() => setOpen(false)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-[#B7B2FF] flex-shrink-0"
          >
            <X size={18} className="text-white" />
          </button>
          {isLoggedIn && userEmail && (
            <span className="bg-[#111] text-white text-sm font-semibold px-4 py-2.5 rounded-full truncate">
              {userEmail}
            </span>
          )}
        </div>

        {/* 메인 메뉴 */}
        <div className="px-6 pb-4">
          <p className="text-xs font-medium text-gray-400 mb-3 tracking-wide">메뉴</p>
          <Link href="/download" onClick={() => setOpen(false)} className={linkClass()}>다운로드</Link>
          <Link href="/products" onClick={() => setOpen(false)} className={linkClass(pathname.startsWith("/products"))}>상품</Link>
          <Link href="/blog" onClick={() => setOpen(false)} className={linkClass(pathname.startsWith("/blog"))}>블로그</Link>
          <Link href="/#faq" onClick={() => setOpen(false)} className={linkClass()}>FAQ</Link>
        </div>

        {/* 계정 메뉴 */}
        {isLoggedIn ? (
          <div className="px-6 pb-4">
            <p className="text-xs font-medium text-gray-400 mb-3 tracking-wide">내 정보</p>
            <Link href="/mypage" onClick={() => setOpen(false)} className={linkClass(pathname === "/mypage")}>마이페이지</Link>
            <Link href="/mypage/purchases" onClick={() => setOpen(false)} className={linkClass(pathname === "/mypage/purchases")}>구매내역</Link>
          </div>
        ) : (
          <div className="px-6 pb-4">
            <Link href="/auth/login" onClick={() => setOpen(false)} className={linkClass()}>로그인</Link>
          </div>
        )}

        {/* 로그아웃 */}
        {isLoggedIn && (
          <div className="mt-auto px-6 pb-10">
            <button
              onClick={handleLogout}
              className="px-6 py-3 rounded-full border border-[#111] text-[#111] text-sm font-semibold hover:bg-[#111] hover:text-white transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}

      </SheetContent>
    </Sheet>
  );
}
