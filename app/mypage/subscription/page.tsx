import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { getUserSubscription } from "./actions";
import { SubscriptionCard } from "@/components/subscription/subscription-card";
import { CreditCard } from "lucide-react";

async function SubscriptionContent() {
  noStore();
  const subscription = await getUserSubscription();

  if (!subscription) {
    return (
      <div className="bg-white rounded-2xl border border-[#111] p-12 text-center">
        <div className="w-16 h-16 bg-[#B7B2FF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CreditCard className="w-8 h-8 text-[#111]" />
        </div>
        <h3 className="text-xl font-bold text-[#111] mb-2">
          구독 중인 플랜이 없습니다
        </h3>
        <p className="text-gray-500 mb-6">
          프리미엄 기능을 이용하려면 플랜을 구독하세요.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 bg-[#111] text-white font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform cursor-pointer"
        >
          플랜 보기
        </Link>
      </div>
    );
  }

  return <SubscriptionCard subscription={subscription} />;
}

function SubscriptionSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-56 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#111] flex items-center gap-3">
          <CreditCard className="h-7 w-7" />
          내 구독
        </h1>
        <p className="text-gray-500 mt-2">
          현재 구독 중인 플랜과 결제 정보를 확인합니다.
        </p>
      </div>

      <Suspense fallback={<SubscriptionSkeleton />}>
        <SubscriptionContent />
      </Suspense>
    </div>
  );
}
