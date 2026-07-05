"use client";

import { motion, Variants } from "framer-motion";
import { InquiryButton } from "@/components/landing/inquiry-button";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
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

export function CTANew() {
  return (
    <section className="pt-16 pb-32 px-6 bg-[#F9F9FB]">
      <motion.div
        className="max-w-5xl mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* <motion.h2
          variants={itemVariants}
          className="text-5xl md:text-6xl font-black tracking-tight text-[#111] mb-6 leading-[1.1]"
        >
          Start your journey
          <br />
          with{" "}
          <span className="text-[#B7B2FF] italic">VibeBase</span>
        </motion.h2> */}

        <motion.p
          variants={itemVariants}
          className="text-[#111] font-medium mb-12"
        >
          20년이상 풀스택 개발자, 전 스타트업 CTO 출신에게 배우는 바이브 코딩과 1인 SaaS 런칭법
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center"
        >
          <InquiryButton redirectTo="/" />
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="mt-8 text-xs font-bold text-[#111] uppercase tracking-widest"
        >
          No credit card required. Just free.
        </motion.p>
      </motion.div>
    </section>
  );
}
