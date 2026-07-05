"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { CircleUser, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface UserMenuNewProps {
  email: string;
  isAdmin?: boolean;
}

export function UserMenuNew({ email, isAdmin }: UserMenuNewProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/auth/login");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full p-2 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <CircleUser className="h-5 w-5 text-[#111]" />
        <span className="sr-only">사용자 메뉴</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex justify-end"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-[320px] max-h-[520px] mt-4 mr-4 bg-[#F5F3F0] rounded-[2rem] shadow-2xl flex flex-col p-8"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setOpen(false)}
                  className="w-12 h-12 rounded-full bg-[#B7B2FF] flex items-center justify-center hover:bg-[#a09bef] transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="bg-[#111] text-white text-sm font-bold px-5 py-3 rounded-full truncate max-w-[200px]">
                  {email}
                </div>
              </div>

              {/* Section: 내 정보 */}
              <div className="mb-8">
                <p className="text-gray-400 text-lg mb-3">내 정보</p>
                <nav className="flex flex-col gap-1">
                  <Link
                    href="/mypage"
                    onClick={() => setOpen(false)}
                    className="text-[#111] text-xl font-bold py-1 hover:text-[#B7B2FF] transition-colors"
                  >
                    마이페이지
                  </Link>
                  <Link
                    href="/mypage/purchases"
                    onClick={() => setOpen(false)}
                    className="text-[#111] text-xl font-bold py-1 hover:text-[#B7B2FF] transition-colors"
                  >
                    구매내역
                  </Link>
                </nav>
              </div>

              {/* Section: 관리 */}
              {isAdmin && (
                <div className="mb-8">
                  <p className="text-gray-400 text-lg mb-3">관리</p>
                  <nav className="flex flex-col gap-1">
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="text-[#111] text-xl font-bold py-1 hover:text-[#B7B2FF] transition-colors"
                    >
                      관리자 설정
                    </Link>
                  </nav>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Footer */}
              <div className="flex items-center gap-3 pb-6">
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 rounded-full border border-[#111] text-[#111] font-bold text-sm hover:bg-[#111] hover:text-white transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
