import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ShoppingBag, User, KeyRound } from "lucide-react";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const menuItems = [
    {
      href: "/mypage/purchases",
      icon: ShoppingBag,
      title: "구매 내역",
      description: "상품 구매 내역을 확인합니다.",
    },
    {
      href: "/mypage/profile",
      icon: User,
      title: "회원정보 수정",
      description: "이름, 이메일 등 회원정보를 수정합니다.",
    },
    {
      href: "/mypage/password",
      icon: KeyRound,
      title: "비밀번호 변경",
      description: "계정 비밀번호를 변경합니다.",
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#111]">마이페이지</h1>
        <p className="text-gray-500 mt-2">{user.email}</p>
      </div>

      <div className="grid gap-4">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="bg-white rounded-2xl border border-[#111] p-6 flex items-center gap-5 hover:shadow-xl transition-all duration-300 cursor-pointer group">
              <div className="w-12 h-12 bg-[#B7B2FF]/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6 text-[#111]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#111]">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-[#111] group-hover:translate-x-1 transition-all"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
