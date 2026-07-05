"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";

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
          회원가입부터 결제까지, SaaS의 필수 기능이 이미 준비되어 있습니다. 지금 바로 시작하세요.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center"
        >
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#111] text-white font-bold text-sm hover:bg-[#B7B2FF] transition-colors"
          >
            무료로 시작하기
          </Link>
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
