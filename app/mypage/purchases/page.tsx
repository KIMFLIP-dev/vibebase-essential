import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { getUserPurchases } from "@/app/purchases/actions";
import { ShoppingBag, Download } from "lucide-react";
import type { Purchase, PurchaseStatus } from "@/lib/types/admin";

function getStatusLabel(status: PurchaseStatus, isRefunded: boolean) {
  if (isRefunded) return { text: "환불됨", style: "bg-red-100 text-red-700" };
  switch (status) {
    case "completed":
      return { text: "완료", style: "bg-[#B7B2FF]/20 text-[#111]" };
    case "refunded":
      return { text: "환불됨", style: "bg-red-100 text-red-700" };
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

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const status = getStatusLabel(purchase.status, purchase.is_refunded);

  return (
    <div className="bg-white rounded-2xl border border-[#111] p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#111]">
            {purchase.plan?.name || "상품"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(purchase.created_at)}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${status.style}`}>
          {status.text}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xl font-black text-[#111]">
          {formatCurrency(purchase.amount, purchase.currency)}
        </span>
        {purchase.plan?.download_url && (
          <a
            href={purchase.plan.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#111] text-white font-bold text-sm px-5 py-2.5 rounded-full hover:scale-105 transition-transform"
          >
            <Download size={14} />
            다운로드
          </a>
        )}
      </div>
    </div>
  );
}

async function PurchasesContent() {
  noStore();
  const purchases = await getUserPurchases();

  if (purchases.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#111] p-12 text-center">
        <div className="w-16 h-16 bg-[#B7B2FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8 text-[#111]" />
        </div>
        <h3 className="text-xl font-bold text-[#111] mb-2">
          구매 내역이 없습니다
        </h3>
        <p className="text-gray-500 mb-6">
          아직 구매한 상품이 없습니다. 상품을 둘러보세요.
        </p>
        <Link
          href="/purchases"
          className="inline-flex items-center gap-2 bg-[#111] text-white font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform"
        >
          상품 보기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => (
        <PurchaseCard key={purchase.id} purchase={purchase} />
      ))}
      <div className="flex justify-center pt-4">
        <Link
          href="/purchases"
          className="inline-flex items-center gap-2 bg-white border border-[#111] text-[#111] font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform"
        >
          더 많은 상품 보기
        </Link>
      </div>
    </div>
  );
}

function PurchasesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
          <div className="flex justify-between mb-4">
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
            <div className="h-6 w-14 bg-gray-200 rounded-full" />
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function UserPurchasesPage() {
  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#111] flex items-center gap-3">
          <ShoppingBag className="h-7 w-7" />
          상품 구매 내역
        </h1>
        <p className="text-gray-500 mt-2">
          구매한 상품 내역을 확인합니다.
        </p>
      </div>

      <Suspense fallback={<PurchasesSkeleton />}>
        <PurchasesContent />
      </Suspense>
    </div>
  );
}
