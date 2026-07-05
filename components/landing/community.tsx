"use client";

import { motion, Variants } from "framer-motion";
import { Star } from "lucide-react";

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

const testimonials = [
  {
    quote:
      "바이브코딩을 처음 접하는 저에게 바이브베이스는 최고의 선택이었습니다. Cursor, Windsurf, Claude Code 등 다양한 AI 코딩툴을 실전처럼 실습할 수 있었고, 플립님의 명쾌한 설명 덕분에 강의에 몰입할 수 있었습니다.",
    name: "김하늘",
    role: "바이브코딩 강의 수강생",
    initial: "김",
    color: "bg-[#B7B2FF]",
  },
  {
    quote:
      "바이브코딩으로 하나의 서비스를 만들고 배포하는 과정을 모두 지켜볼 수 있는 좋은 기회가 됐습니다. 단순히 비개발자도 뭐든 만들 수 있어요가 아니라, 바이브코딩을 통해서 점차 개발자가 되어가는 기회가 된다는 점에서 새로운 시민 개발자의 시대를 그려볼 수 있게 됐습니다.",
    name: "이준혁",
    role: "바이브코딩 강의 수강생",
    initial: "이",
    color: "bg-[#111]",
  },
];

export function CommunityNew() {
  return (
    <section id="community" className="py-24 px-6 bg-white">
      <motion.div
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-[#111] mb-4">
            <span className="inline-block px-5 py-1 bg-[#B7B2FF] text-white rounded-full italic mr-2">VibeBase</span>
            수강생 후기
          </h2>
          <p className="text-[#111] font-medium max-w-xl mx-auto">
            120명 이상의 수강생과 함께하고 있습니다.
          </p>
        </motion.div>

        {/* Testimonial Cards */}
        <motion.div
          variants={containerVariants}
          className="grid md:grid-cols-2 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={itemVariants}
              className="bg-white rounded-2xl border border-[#111] p-8 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={16} className="fill-[#B7B2FF] text-[#B7B2FF]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#111] leading-relaxed mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-[#111]/10">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                  {t.initial}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#111]">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
