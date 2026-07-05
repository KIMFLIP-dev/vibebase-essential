"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, Variants } from "framer-motion";
import type { PricingPlan } from "@/lib/types/admin";

interface Props {
  plan: PricingPlan;
  billingPeriod: "monthly" | "yearly";
  variants?: Variants;
  onSubscribe?: (planId: string, billingPeriod: "monthly" | "yearly") => void;
  isLoading?: boolean;
  isUpgrade?: boolean;
  isCurrentPlan?: boolean;
  isDowngrade?: boolean;
}

function formatPrice(dollars: number): string {
  return dollars.toFixed(2);
}

export function PricingCard({ plan, billingPeriod, variants, onSubscribe, isLoading, isUpgrade, isCurrentPlan, isDowngrade }: Props) {
  const price =
    billingPeriod === "yearly" && plan.price_yearly
      ? plan.price_yearly
      : plan.price_monthly;

  const monthlyEquivalent =
    billingPeriod === "yearly" && plan.price_yearly
      ? Math.round(plan.price_yearly / 12)
      : plan.price_monthly;

  const savings =
    billingPeriod === "yearly" && plan.price_yearly
      ? Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)
      : 0;

  return (
    <motion.div
      variants={variants}
      className={`relative rounded-3xl border bg-background p-8 shadow-sm transition-all hover:shadow-xl ${
        plan.is_popular
          ? "border-primary shadow-primary/10 scale-105 z-10"
          : "border-border/40"
      }`}
    >
      {plan.is_popular && (
        <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          {plan.name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">
            ${formatPrice(monthlyEquivalent)}
          </span>
          <span className="text-muted-foreground">/월</span>
        </div>
        {billingPeriod === "yearly" && plan.price_yearly && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              연 ${formatPrice(price)} 결제
            </span>
            {savings > 0 && (
              <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                {savings}% 할인
              </span>
            )}
          </div>
        )}
        {plan.description && (
          <p className="mt-4 text-sm text-muted-foreground">
            {plan.description}
          </p>
        )}
      </div>

      <ul className="mb-8 space-y-4">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className={`w-full rounded-full h-12 ${
          isCurrentPlan || isDowngrade
            ? "bg-muted text-muted-foreground"
            : plan.is_popular
              ? "bg-primary hover:bg-primary/90"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        }`}
        onClick={() => onSubscribe?.(plan.id, billingPeriod)}
        disabled={isCurrentPlan || isDowngrade || isLoading || !(billingPeriod === "yearly" ? plan.creem_product_id_yearly : plan.creem_product_id)}
      >
        {isCurrentPlan
          ? "현재 구독중"
          : isDowngrade
            ? "다운그레이드 불가"
            : isLoading
              ? "처리 중..."
              : (billingPeriod === "yearly" ? plan.creem_product_id_yearly : plan.creem_product_id)
                ? (isUpgrade ? "업그레이드" : "시작하기")
                : "준비 중"}
      </Button>
    </motion.div>
  );
}
