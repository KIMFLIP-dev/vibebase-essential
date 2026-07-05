import { redirect } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserPurchases } from "@/app/products/actions";
import { ShoppingBag, Download, Receipt } from "lucide-react";
import type { PurchaseStatus } from "@/lib/types/product";

function getStatusBadge(status: PurchaseStatus, isRefunded: boolean) {
  if (isRefunded || status === "refunded") {
    return { text: "환불됨", style: "bg-red-100 text-red-700" };
  }
  switch (status) {
    case "completed":
      return { text: "완료", style: "bg-[#B7B2FF]/20 text-[#111]" };
    case "failed":
      return { text: "실패", style: "bg-gray-100 text-gray-600" };
    default:
      return { text: status, style: "bg-gray-100 text-gray-600" };
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MyPurchasesPage() {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const purchases = await getUserPurchases();

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#111] flex items-center gap-3">
          <ShoppingBag className="h-7 w-7" />
          구매 내역
        </h1>
        <p className="text-gray-500 mt-2">상품 구매 내역을 확인합니다.</p>
      </div>

      {purchases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#111] p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-6">구매 내역이 없습니다.</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-[#111] text-white rounded-full font-bold text-sm hover:bg-[#B7B2FF] transition-colors"
          >
            상품 둘러보기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => {
            const badge = getStatusBadge(purchase.status, purchase.is_refunded);
            const productName =
              purchase.product?.name || purchase.product_name || "삭제된 상품";

            return (
              <div
                key={purchase.id}
                className="bg-white rounded-2xl border border-[#111] p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {purchase.product ? (
                      <Link
                        href={`/products/${purchase.product.slug}`}
                        className="font-bold text-[#111] hover:text-[#B7B2FF] transition-colors"
                      >
                        {productName}
                      </Link>
                    ) : (
                      <span className="font-bold text-[#111]">{productName}</span>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(purchase.created_at)}
                    </p>
                    {purchase.order_id && (
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        {purchase.order_id}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${badge.style}`}
                    >
                      {badge.text}
                    </span>
                    <p className="text-lg font-black text-[#111] mt-2">
                      {Number(purchase.amount).toLocaleString()}원
                    </p>
                    {purchase.is_refunded && Number(purchase.refunded_amount) > 0 && (
                      <p className="text-xs text-red-500">
                        환불 {Number(purchase.refunded_amount).toLocaleString()}원
                      </p>
                    )}
                  </div>
                </div>

                {(purchase.receipt_url ||
                  (purchase.status === "completed" &&
                    purchase.product?.download_url)) && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#111]/10">
                    {purchase.status === "completed" &&
                      purchase.product?.download_url && (
                        <a
                          href={purchase.product.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#111] hover:text-[#B7B2FF] transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          다운로드
                        </a>
                      )}
                    {purchase.receipt_url && (
                      <a
                        href={purchase.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-[#B7B2FF] transition-colors"
                      >
                        <Receipt className="w-4 h-4" />
                        영수증
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
