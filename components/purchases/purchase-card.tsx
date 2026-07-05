"use client";

import { Check, Loader2 } from "lucide-react";
import { motion, Variants } from "framer-motion";
import type { PricingPlan } from "@/lib/types/admin";

interface Props {
  plan: PricingPlan;
  variants?: Variants;
  onPurchase?: (planId: string) => void;
  isLoading?: boolean;
}

export function PurchaseCard({ plan, variants, onPurchase, isLoading }: Props) {
  const hasProduct = !!plan.creem_product_id;

  return (
    <motion.div
      variants={variants}
      className={`relative bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-xl flex flex-col ${
        plan.is_popular
          ? "border-2 border-[#B7B2FF] scale-105 z-10"
          : "border border-[#111]"
      }`}
    >
      {plan.is_popular && (
        <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-[#B7B2FF] px-4 py-1 text-sm font-bold text-white">
          인기 상품
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-500 mb-3">
          {plan.name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-[#111]">
            ₩{plan.price_monthly.toLocaleString()}
          </span>
        </div>
        {plan.description && (
          <p className="mt-4 text-sm text-gray-500 leading-relaxed">
            {plan.description}
          </p>
        )}
      </div>

      <ul className="mb-8 space-y-3 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-[#111]">
            <Check className="h-4 w-4 text-[#B7B2FF] flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        className={`w-full py-4 rounded-full font-bold text-lg transition-all ${
          plan.is_popular
            ? "bg-[#B7B2FF] text-white hover:scale-105"
            : "bg-[#111] text-white hover:scale-105"
        } ${isLoading || !hasProduct ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => onPurchase?.(plan.id)}
        disabled={isLoading || !hasProduct}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            처리 중...
          </span>
        ) : hasProduct ? (
          "구매하기"
        ) : (
          "준비 중"
        )}
      </button>
    </motion.div>
  );
}
