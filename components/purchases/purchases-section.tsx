"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { PurchaseCard } from "./purchase-card";
import type { PricingPlan } from "@/lib/types/admin";
import { createPurchaseCheckoutSession } from "@/app/purchases/actions";

interface Props {
  plans: PricingPlan[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export function PurchasesSection({ plans }: Props) {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    setLoadingPlanId(planId);
    try {
      const { checkoutUrl } = await createPurchaseCheckoutSession(planId);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error instanceof Error ? error.message : "결제 처리 중 오류가 발생했습니다.");
      setLoadingPlanId(null);
    }
  };

  if (plans.length === 0) {
    return (
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-[#111] mb-4">
            프리미엄 상품
          </h2>
          <p className="text-gray-500">현재 등록된 상품이 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-36 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#111] mb-4">
            <span className="inline-block px-5 py-1 bg-[#B7B2FF] text-white rounded-full italic mr-2">VibeBase</span>
            프리미엄 상품
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            필요한 상품을 구매하세요. 일회성 결제로 영구적으로 이용 가능합니다.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className={`grid gap-8 ${
            plans.length === 1
              ? "max-w-md mx-auto"
              : plans.length === 2
              ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
              : "grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto"
          }`}
        >
          {plans.map((plan) => (
            <PurchaseCard
              key={plan.id}
              plan={plan}
              variants={itemVariants}
              onPurchase={handlePurchase}
              isLoading={loadingPlanId === plan.id}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
