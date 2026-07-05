"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { PricingCard } from "./pricing-card";
import type { PricingPlan } from "@/lib/types/admin";
import { createCheckoutSession } from "@/app/pricing/actions";
import { upgradeSubscription } from "@/app/mypage/subscription/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PendingCancellation {
  hasPendingCancellation: boolean;
  remainingDays: number | null;
  planName: string | null;
  endDate: string | null;
}

interface CurrentSubscription {
  planId: string;
  billingPeriod: "monthly" | "yearly";
  amount: number;
}

interface Props {
  plans: PricingPlan[];
  pendingCancellation?: PendingCancellation | null;
  currentSubscription?: CurrentSubscription | null;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function PricingSection({ plans, pendingCancellation, currentSubscription }: Props) {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    currentSubscription?.billingPeriod || "monthly"
  );
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<PricingPlan | null>(null);

  const hasYearlyPricing = plans.some((plan) => plan.price_yearly !== null);
  const hasPendingCancellation = pendingCancellation?.hasPendingCancellation;

  // 구독형 플랜만 표시
  const filteredPlans = plans.filter((plan) => plan.billing_type === "recurring");

  // 현재 구독 중인 플랜인지 확인
  const isCurrentPlan = (plan: PricingPlan) => {
    return currentSubscription?.planId === plan.id;
  };

  // 업그레이드 가능 여부 확인 (현재 구독보다 가격이 높은 플랜)
  const isUpgradeable = (plan: PricingPlan) => {
    if (!currentSubscription) return false;
    if (isCurrentPlan(plan)) return false;
    const planPrice = billingPeriod === "yearly" ? (plan.price_yearly || 0) : plan.price_monthly;
    return planPrice > currentSubscription.amount;
  };

  // 다운그레이드 여부 확인 (현재 구독보다 가격이 낮은 플랜)
  const isDowngrade = (plan: PricingPlan) => {
    if (!currentSubscription) return false;
    if (isCurrentPlan(plan)) return false;
    const planPrice = billingPeriod === "yearly" ? (plan.price_yearly || 0) : plan.price_monthly;
    return planPrice < currentSubscription.amount;
  };

  const processCheckout = async (planId: string, period: "monthly" | "yearly") => {
    setLoadingPlanId(planId);
    try {
      const { checkoutUrl } = await createCheckoutSession(planId, period);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error instanceof Error ? error.message : "결제 처리 중 오류가 발생했습니다.");
      setLoadingPlanId(null);
    }
  };

  const handleSubscribe = async (planId: string, period: "monthly" | "yearly") => {
    const plan = plans.find((p) => p.id === planId);

    // 취소 예정 구독이 있으면 결제 차단
    if (hasPendingCancellation) {
      toast.error("결제할 수 없습니다", {
        description: "취소 예정인 구독이 있습니다. 구독 관리에서 취소를 철회하거나, 만료 후 다시 구독해주세요.",
        duration: 5000,
      });
      return;
    }

    // 업그레이드 가능한 경우 업그레이드 다이얼로그 표시
    if (plan && isUpgradeable(plan)) {
      setSelectedUpgradePlan(plan);
      setUpgradeDialogOpen(true);
      return;
    }

    await processCheckout(planId, period);
  };

  const handleUpgradeConfirm = async () => {
    if (!selectedUpgradePlan) return;

    setIsUpgrading(true);
    try {
      const result = await upgradeSubscription(selectedUpgradePlan.id);
      if (result.success) {
        toast.success("플랜이 업그레이드되었습니다.");
        setUpgradeDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "플랜 업그레이드에 실패했습니다.");
      }
    } catch {
      toast.error("플랜 업그레이드 중 오류가 발생했습니다.");
    } finally {
      setIsUpgrading(false);
    }
  };

  if (filteredPlans.length === 0) {
    return (
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              가격 안내
            </h2>
            <p className="text-lg text-muted-foreground">
              현재 등록된 가격 플랜이 없습니다.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-6">
        {/* 취소 예정 구독 경고 배너 */}
        {hasPendingCancellation && pendingCancellation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-8 p-4 bg-orange-50 border border-orange-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">
                  취소 예정인 구독이 있어 새 결제가 불가합니다
                </p>
                <p className="text-orange-700 mt-1">
                  현재 {pendingCancellation.planName} 플랜이 {pendingCancellation.remainingDays}일 남아있습니다.
                  구독 관리에서 취소를 철회하거나, 만료 후 다시 구독해주세요.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            필요에 맞는 플랜을 선택하세요. 언제든지 업그레이드하거나 취소할 수 있습니다.
          </p>

          {hasYearlyPricing && (
            <div className="inline-flex items-center gap-1 p-1 bg-secondary rounded-full">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                월간
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                연간
                <span className="ml-1 text-xs text-green-600">할인</span>
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className={`grid gap-8 ${
            filteredPlans.length === 1
              ? "max-w-md mx-auto"
              : filteredPlans.length === 2
              ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
              : "grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto"
          }`}
        >
          {filteredPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              variants={itemVariants}
              onSubscribe={handleSubscribe}
              isLoading={loadingPlanId === plan.id}
              isUpgrade={isUpgradeable(plan)}
              isCurrentPlan={isCurrentPlan(plan)}
              isDowngrade={isDowngrade(plan)}
            />
          ))}
        </motion.div>
      </div>
    </section>

    {/* 업그레이드 확인 다이얼로그 */}
    <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>플랜 업그레이드</DialogTitle>
          <DialogDescription>
            {selectedUpgradePlan?.name} 플랜으로 업그레이드하시겠습니까?
          </DialogDescription>
        </DialogHeader>
        {selectedUpgradePlan && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{selectedUpgradePlan.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUpgradePlan.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {formatCurrency(
                      billingPeriod === "yearly"
                        ? (selectedUpgradePlan.price_yearly || 0)
                        : selectedUpgradePlan.price_monthly,
                      selectedUpgradePlan.currency
                    )}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{billingPeriod === "yearly" ? "년" : "월"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              차액은 즉시 청구됩니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setUpgradeDialogOpen(false)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-secondary"
                disabled={isUpgrading}
              >
                취소
              </button>
              <button
                onClick={handleUpgradeConfirm}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                disabled={isUpgrading}
              >
                {isUpgrading ? "처리 중..." : "업그레이드"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
