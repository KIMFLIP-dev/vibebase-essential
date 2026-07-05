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
    title: "소스? 그냥 가져가기",
    description:
      "인증·결제·관리자 다 박혀있는 스타터킷. 클론 한 방이면 끝. 0원.",
    icon: (
      <svg
        className="w-14 h-14 text-[#111]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    iconBg: "",
  },
  {
    title: "유튜브에서 못 다 한 썰",
    description:
      "AI 코딩 워크플로우부터 삽질썰까지. 진짜 알맹이는 글에 있음.",
    icon: (
      <svg
        className="w-14 h-14 text-[#111]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
    iconBg: "",
  },
  {
    title: "혼코딩 그만",
    description:
      "막히면 물어보고, 만들면 자랑하고. 같이 가면 멀리 간다.",
    icon: (
      <svg
        className="w-14 h-14 text-[#111]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    iconBg: "",
  },
  {
    title: "무료로 맛보고, 제대로 배우고",
    description:
      "입문은 공짜. 더 깊게도 얼마든지. 네 속도대로 달려봐.",
    icon: (
      <svg
        className="w-14 h-14 text-[#111]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 10L12 5 2 10l10 5 10-5z" />
        <path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" />
      </svg>
    ),
    iconBg: "",
  },
];

export function FeaturesNew2() {
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
          보기만 하지 말고, 만들자
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="text-[#111] font-medium max-w-2xl mx-auto mb-16"
        >
          소스 받고, 글 읽고, 떠들고, 강의 듣고. 에이전틱 코딩, 여기서 다 끝낸다.
        </motion.p>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="p-8 rounded-[2.5rem] bg-white hover:shadow-xl transition-all duration-300 border border-[#111] text-left"
            >
              <div
                className={`w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[#111] mb-3">
                {feature.title}
              </h3>
              <p className="text-[#111] leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
