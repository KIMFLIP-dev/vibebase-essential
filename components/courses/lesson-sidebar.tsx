"use client";

import { useRouter } from "next/navigation";
import { LessonList } from "@/components/courses/lesson-list";
import type { CourseWithChapters } from "@/lib/types/course";
import { toast } from "sonner";

interface LessonSidebarProps {
  course: CourseWithChapters;
  activeLessonId: string;
  purchased: boolean;
}

export function LessonSidebar({
  course,
  activeLessonId,
  purchased,
}: LessonSidebarProps) {
  const router = useRouter();

  const handleLessonClick = (lessonId: string, isFree: boolean) => {
    if (isFree || purchased) {
      router.push(`/courses/${course.slug}/lessons/${lessonId}`);
    } else {
      toast.info("코스를 구매하면 시청할 수 있습니다");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-[#111]/10">
        <h3 className="font-bold text-sm text-[#111] truncate">
          {course.title}
        </h3>
      </div>
      <div className="p-2">
        <LessonList
          chapters={course.chapters}
          purchased={purchased}
          activeLessonId={activeLessonId}
          onLessonClick={handleLessonClick}
        />
      </div>
    </div>
  );
}
