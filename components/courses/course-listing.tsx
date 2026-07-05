"use client";

import { CourseCard } from "@/components/courses/course-card";
import type { Course } from "@/lib/types/course";

interface CourseListingProps {
  courses: Course[];
}

export function CourseListing({ courses }: CourseListingProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">
          아직 등록된 강좌가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
