"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, Calendar, CreditCard, ArrowUp } from "lucide-react";
import { cancelSubscription } from "@/app/mypage/subscription/actions";
import type { Subscription } from "@/lib/types/admin";
import { toast } from "sonner";

interface Props {
  subscription: Subscription;
}

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function getRemainingDays(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function SubscriptionCard({ subscription }: Props) {
  const isScheduledCancel = subscription.status === "scheduled_cancel";
  const isCanceled = subscription.status === "canceled";
  const remainingDays = getRemainingDays(subscription.current_period_end);
  const isPendingCancellation = isScheduledCancel && remainingDays !== null && remainingDays > 0;
  const isFullyCanceled = isCanceled || (isScheduledCancel && (remainingDays === null || remainingDays <= 0));
  const isActive = subscription.status === "active";
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelSubscription();
      if (result.success) {
        toast.success("구독이 취소되었습니다.");
        router.refresh();
      } else {
        toast.error(result.error || "구독 취소에 실패했습니다.");
      }
    } catch {
      toast.error("구독 취소 중 오류가 발생했습니다.");
    } finally {
      setIsCancelling(false);
    }
  };

  const statusLabel = isFullyCanceled
    ? { text: "취소됨", style: "bg-red-100 text-red-700" }
    : isPendingCancellation
    ? { text: "취소 예정", style: "bg-orange-100 text-orange-700" }
    : { text: "활성", style: "bg-[#B7B2FF]/20 text-[#111]" };

  return (
    <div className="bg-white rounded-2xl border border-[#111] overflow-hidden">
      {/* Header */}
      <div className="p-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-black text-[#111]">
              {subscription.plan?.name || "구독 플랜"}
            </h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusLabel.style}`}>
              {statusLabel.text}
            </span>
          </div>
          {subscription.plan?.description && (
            <p className="text-gray-500 text-sm">{subscription.plan.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#111]">
            {formatCurrency(subscription.amount, subscription.currency)}
          </p>
          <p className="text-sm text-gray-500">
            / {subscription.billing_period === "yearly" ? "년" : "월"}
          </p>
        </div>
      </div>

      {/* 구독 정보 */}
      <div className="px-8 pb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-4 w-4" />
            시작일
          </div>
          <div className="text-right font-bold text-[#111]">
            {formatDate(subscription.created_at)}
          </div>

          <div className="flex items-center gap-2 text-gray-500">
            <CreditCard className="h-4 w-4" />
            결제 주기
          </div>
          <div className="text-right font-bold text-[#111]">
            {subscription.billing_period === "yearly" ? "연간 결제" : "월간 결제"}
          </div>

          {subscription.current_period_end && (
            <>
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="h-4 w-4" />
                {isScheduledCancel || isCanceled ? "서비스 종료일" : "다음 결제일"}
              </div>
              <div className="text-right font-bold text-[#111]">
                {formatDate(subscription.current_period_end)}
                {remainingDays !== null && (
                  <span className={`ml-2 text-sm ${isScheduledCancel ? "text-orange-600" : "text-gray-500"}`}>
                    ({remainingDays}일 남음)
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 기능 목록 */}
      {subscription.plan?.features && subscription.plan.features.length > 0 && (
        <div className="px-8 pb-6 border-t border-[#111]/10 pt-6">
          <p className="text-sm font-bold text-[#111] mb-3">포함된 기능</p>
          <ul className="space-y-2">
            {subscription.plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-[#111]">
                <Check className="h-4 w-4 text-[#B7B2FF] flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 액션 */}
      <div className="px-8 pb-8 border-t border-[#111]/10 pt-6">
        {isFullyCanceled ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm">
              <p className="font-bold text-red-800">구독이 취소되었습니다</p>
              <p className="text-red-700 mt-1">
                서비스 이용이 종료되었습니다. 다시 이용하시려면 새로 구독해주세요.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-[#111] text-white font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform cursor-pointer"
            >
              다시 구독하기
            </Link>
          </div>
        ) : isPendingCancellation ? (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm">
              <p className="font-bold text-orange-800">구독 취소가 예정되어 있습니다</p>
              <p className="text-orange-700 mt-1">
                {subscription.current_period_end
                  ? `${formatDate(subscription.current_period_end)}까지 서비스를 이용하실 수 있습니다.`
                  : "현재 결제 기간이 종료되면 서비스 이용이 제한됩니다."}
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-white border border-[#111] text-[#111] font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform cursor-pointer"
            >
              다른 플랜 보기
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {isActive && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-[#111] text-white font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform cursor-pointer"
              >
                <ArrowUp className="h-4 w-4" />
                플랜 업그레이드
              </Link>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="px-6 py-3 bg-white border border-red-400 text-red-600 font-bold text-sm rounded-full hover:scale-105 transition-transform cursor-pointer">
                  구독 취소
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black text-[#111]">구독을 취소하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    구독을 취소하면 현재 결제 기간이 끝난 후 서비스 이용이 제한됩니다.
                    취소 후에도 현재 기간 동안은 계속 이용하실 수 있습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="bg-red-600 text-white hover:bg-red-700 rounded-full"
                  >
                    {isCancelling ? "처리 중..." : "구독 취소"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}
