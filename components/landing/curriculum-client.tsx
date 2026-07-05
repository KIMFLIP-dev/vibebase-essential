"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { PlayCircle } from "lucide-react";
import { BookOpen } from "lucide-react";

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

interface CurriculumCourse {
  slug: string;
  title: string;
  description: string;
  lectures: number;
  price: string;
  image: string;
  isComingSoon: boolean;
}

export function CurriculumClient({ courses }: { courses: CurriculumCourse[] }) {
  return (
    <section id="curriculum" className="py-24 px-6 bg-[#F9F9FB]">
      <motion.div
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6"
        >
          <div>
            <h2 className="text-4xl font-black text-[#111] mb-4">
              커리큘럼
            </h2>
            <p className="text-[#111]">
              삽질 없이 순서대로. 끝엔 진짜 서비스 하나 남음.
              <br />
              유튜브에서 흘려보내기 아까운 강의들, 구독자님들만 보라고 여기 모셔둠.
            </p>
          </div>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          className="grid md:grid-cols-3 gap-8"
        >
          {courses.map((course) => (
            <Link key={course.slug} href={`/courses/${course.slug}`}>
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#111] cursor-pointer h-full flex flex-col"
              >
                {/* Image */}
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  {course.image ? (
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      className={`object-cover ${
                        course.isComingSoon ? "blur-[1px] scale-105" : ""
                      }`}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#B7B2FF]/30 to-[#B7B2FF]/10 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-[#B7B2FF]/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/40" />
                  {course.isComingSoon && (
                    <div className="absolute inset-0 bg-white/15 backdrop-blur-[1px]" />
                  )}
                  {course.isComingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white text-[#111] text-xl font-black px-8 py-3 rounded-full shadow-lg">
                        준비중
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-[#111] mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    {course.lectures > 0 && (
                      <span className="text-xs font-bold text-[#111] flex items-center gap-1">
                        <PlayCircle size={16} /> {course.lectures}개 강의
                      </span>
                    )}
                    {course.isComingSoon ? (
                      <span className="text-[#111]/40 font-bold text-sm">공개 예정</span>
                    ) : course.price === "무료" ? (
                      <span className="text-xl font-black text-[#111] px-1.5 bg-[#7FFF00]/70 rounded">
                        무료
                      </span>
                    ) : (
                      <span className="text-[#B7B2FF] font-bold">
                        {course.price}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
