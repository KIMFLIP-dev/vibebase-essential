import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShoppingBag } from "lucide-react";

// TODO(Phase 4): product_purchases 기반 구매 내역으로 재작성 예정
export default async function MyPurchasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#111]">구매 내역</h1>
        <p className="text-gray-500 mt-2">상품 구매 내역을 확인합니다.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#111] p-12 text-center">
        <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">구매 내역이 없습니다.</p>
      </div>
    </div>
  );
}
