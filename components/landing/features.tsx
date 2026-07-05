"use client";

import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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

const features = [
  {
    title: "강력한 인증 시스템",
    description:
      "Supabase Auth 기반의 안전한 인증. 소셜 로그인과 역할 기반 접근 제어가 포함되어 있습니다.",
    icon: (
      <svg
        className="w-16 h-16 text-[#111]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    iconBg: "",
  },
  {
    title: "간편한 결제 연동",
    description:
      "포트원(PortOne) 연동으로 구독 및 일회성 결제를 손쉽게 구현하세요. 카카오페이, 토스 등 다양한 결제수단을 지원합니다.",
    icon: (
      <svg
        className="w-16 h-16 text-[#111]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
      </svg>
    ),
    iconBg: "",
  },
  {
    title: "관리자 대시보드",
    description:
      "사용자, 콘텐츠, 시스템 설정을 손쉽게 관리할 수 있는 강력한 관리자 패널. 20년차 CTO 출신 개발자의 세심한 설계를 느껴보세요.",
    icon: (
      <svg
        className="w-16 h-16 text-[#111]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    iconBg: "",
  },
];

export function FeaturesNew() {
  return (
    <section id="why" className="py-32 px-6 bg-white">
      <motion.div
        className="max-w-7xl mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Header */}
        <motion.h2
          variants={itemVariants}
          className="text-4xl md:text-5xl font-black text-[#111] mb-4"
        >
          핵심에만 집중
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="text-[#111] font-medium max-w-2xl mx-auto mb-16"
        >
          안전한 소셜 로그인, 복잡한 구독 결제 시스템, 강력한 관리자 기능까지. 간단히 레포를 클론 하는것만으로도 검증된 아키텍처 위에서 나의 서비스를 즉시 런칭 하는것과 다름없는 베이스를 느껴보세요.
        </motion.p>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="p-10 rounded-[2.5rem] bg-white hover:shadow-xl transition-all duration-300 border border-[#111] text-left"
            >
              <div
                className={`w-20 h-20 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-8`}
              >
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-[#111] mb-4">
                {feature.title}
              </h3>
              <p className="text-[#111] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
