"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Clock, BookOpen, PlayCircle } from "lucide-react";
import { VideoPlayer } from "@/components/courses/video-player";
import { LessonList } from "@/components/courses/lesson-list";
import { CoursePurchaseButton } from "@/components/courses/course-purchase-button";
import { formatTotalDuration } from "@/lib/vimeo/client";
import { toast } from "sonner";
import type { CourseWithChapters } from "@/lib/types/course";
import { motion } from "framer-motion";

interface CourseDetailProps {
  course: CourseWithChapters;
  purchased: boolean;
  isLoggedIn: boolean;
  hasSourceCode?: boolean;
}

export function CourseDetail({
  course,
  purchased,
  isLoggedIn,
  hasSourceCode = false,
}: CourseDetailProps) {
  const router = useRouter();
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);

  const handleLessonClick = (lessonId: string, isFree: boolean) => {
    if (isFree) {
      for (const chapter of course.chapters) {
        const lesson = chapter.lessons.find((l) => l.id === lessonId);
        if (lesson?.vimeo_video_id) {
          setPreviewVideoId(lesson.vimeo_video_id);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }
    } else if (purchased) {
      router.push(`/courses/${course.slug}/lessons/${lessonId}`);
    } else {
      toast.info("코스를 구매하면 시청할 수 있습니다");
    }
  };

  const isComingSoon = course.is_coming_soon;

  const hasDiscount =
    !isComingSoon &&
    course.original_price != null &&
    course.original_price > course.price &&
    course.price > 0;

  const discountPercent = hasDiscount
    ? Math.round((1 - course.price / course.original_price!) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* 상단 영상/썸네일 영역 */}
      <div className="mb-8">
        {previewVideoId ? (
          <div className="rounded-2xl overflow-hidden">
            <VideoPlayer vimeoVideoId={previewVideoId} />
          </div>
        ) : course.thumbnail_url ? (
          <div className="aspect-video relative rounded-2xl overflow-hidden bg-gray-200">
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className={`object-cover ${
                isComingSoon ? "blur-[2px] scale-105" : ""
              }`}
              priority
              sizes="(max-width: 768px) 100vw, 800px"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/30" />
            {isComingSoon && (
              <div className="absolute inset-0 bg-white/15 backdrop-blur-[1px]" />
            )}
            {isComingSoon ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white text-[#111] text-2xl sm:text-3xl font-black px-10 py-4 rounded-full shadow-lg">
                  준비중
                </span>
              </div>
            ) : (
              hasDiscount && (
                <span className="absolute top-4 left-4 bg-[#B7B2FF] text-white text-sm font-black px-4 py-1.5 rounded-full">
                  {discountPercent}% 할인
                </span>
              )
            )}
          </div>
        ) : (
          <div className="aspect-video rounded-2xl bg-[#B7B2FF]/10 flex items-center justify-center relative">
            <BookOpen className="w-16 h-16 text-[#B7B2FF]/30" />
            {isComingSoon && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white text-[#111] text-2xl sm:text-3xl font-black px-10 py-4 rounded-full shadow-lg">
                  준비중
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 코스 정보 */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111] mb-3">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-[#111]/70 leading-relaxed whitespace-pre-line">
              {course.description}
            </p>
          )}
        </div>

        {/* 통계 + 구매 버튼 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-[#111]">
            {(course.lesson_count ?? 0) > 0 && (
              <span className="flex items-center gap-1.5 font-bold">
                <PlayCircle className="w-4 h-4" />
                {course.lesson_count}개 레슨
              </span>
            )}
            {(course.total_duration ?? 0) > 0 && (
              <span className="flex items-center gap-1.5 font-bold">
                <Clock className="w-4 h-4" />
                {formatTotalDuration(course.total_duration!)}
              </span>
            )}
            {!isComingSoon && course.price === 0 && (
              <span className="text-xl font-black px-1.5 rounded bg-[#7FFF00]/70 text-[#111]">
                무료
              </span>
            )}
          </div>
          <div className="w-full sm:w-auto sm:ml-auto">
            <CoursePurchaseButton
              course={course}
              purchased={purchased}
              isLoggedIn={isLoggedIn}
              hasSourceCode={hasSourceCode}
            />
          </div>
        </div>

        <div className="border-t border-[#111]/10" />

        {/* 커리큘럼 */}
        <div>
          <h2 className="text-lg font-black text-[#111] mb-4">
            커리큘럼
          </h2>
          <LessonList
            chapters={course.chapters}
            purchased={purchased}
            onLessonClick={handleLessonClick}
          />
        </div>
      </div>
    </motion.div>
  );
}
