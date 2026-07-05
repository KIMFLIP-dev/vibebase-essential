"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VideoPlayer } from "@/components/courses/video-player";
import { LessonSidebar } from "@/components/courses/lesson-sidebar";
import type { Lesson, CourseWithChapters } from "@/lib/types/course";

interface LessonPageContentProps {
  lesson: Lesson;
  course: CourseWithChapters;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
  purchased: boolean;
  slug: string;
}

export function LessonPageContent({
  lesson,
  course,
  prevLesson,
  nextLesson,
  purchased,
  slug,
}: LessonPageContentProps) {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)]">
      {/* 좌측: 영상 + 레슨 정보 */}
      <div className="flex-1 overflow-y-auto">
        <div className="lg:pl-80">
          {lesson.vimeo_video_id ? (
            <VideoPlayer vimeoVideoId={lesson.vimeo_video_id} />
          ) : (
            <div className="aspect-video bg-[#F9F9FB] flex items-center justify-center rounded-2xl mx-6 mt-4">
              <p className="text-gray-500">영상이 준비되지 않았습니다</p>
            </div>
          )}

          <div className="p-6 space-y-4">
            <h1 className="text-xl sm:text-2xl font-black text-[#111]">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="text-[#111]/70 leading-relaxed whitespace-pre-line">
                {lesson.description}
              </p>
            )}

            {/* 이전/다음 버튼 */}
            <div className="flex items-center justify-between pt-4 border-t border-[#111]/10">
              {prevLesson ? (
                <Link
                  href={`/courses/${slug}/lessons/${prevLesson.id}`}
                  className="inline-flex items-center gap-1 px-5 py-2.5 bg-white border border-[#111] text-[#111] rounded-full font-bold text-sm hover:scale-105 transition-transform"
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전
                </Link>
              ) : (
                <div />
              )}
              {nextLesson ? (
                <Link
                  href={`/courses/${slug}/lessons/${nextLesson.id}`}
                  className="inline-flex items-center gap-1 px-5 py-2.5 bg-[#111] text-white rounded-full font-bold text-sm hover:scale-105 transition-transform"
                >
                  다음
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 우측 사이드바 (데스크탑) */}
      <div className="hidden lg:block w-80 border-l border-[#111]/10 bg-white">
        <LessonSidebar
          course={course}
          activeLessonId={lesson.id}
          purchased={purchased}
        />
      </div>

      {/* 하단 (모바일) */}
      <div className="lg:hidden border-t border-[#111]/10 bg-white">
        <LessonSidebar
          course={course}
          activeLessonId={lesson.id}
          purchased={purchased}
        />
      </div>
    </div>
  );
}
