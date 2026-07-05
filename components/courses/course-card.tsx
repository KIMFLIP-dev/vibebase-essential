"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, BookOpen, PlayCircle } from "lucide-react";
import { formatTotalDuration } from "@/lib/vimeo/client";
import type { Course } from "@/lib/types/course";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const isComingSoon = course.is_coming_soon;

  const hasDiscount =
    !isComingSoon &&
    course.original_price != null &&
    course.original_price > course.price &&
    course.price > 0;

  const discountPercent = hasDiscount
    ? Math.round((1 - course.price / course.original_price!) * 100)
    : 0;

  const formattedPrice =
    course.price > 0 ? `₩${course.price.toLocaleString()}` : "무료";

  return (
    <Link href={`/courses/${course.slug}`}>
      <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#111] cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="aspect-video bg-gray-200 relative overflow-hidden">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
                isComingSoon ? "blur-[1px] scale-105" : ""
              }`}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#B7B2FF]/30 to-[#B7B2FF]/10 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-[#B7B2FF]/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/40" />
          {isComingSoon && (
            <div className="absolute inset-0 bg-white/15 backdrop-blur-[1px]" />
          )}
          {isComingSoon ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white text-[#111] text-xl font-black px-8 py-3 rounded-full shadow-lg">
                준비중
              </span>
            </div>
          ) : course.price === 0 ? (
            <span className="absolute top-4 left-4 bg-[#7FFF00]/70 text-[#111] text-xs font-black px-3 py-1 rounded-full">
              FREE
            </span>
          ) : (
            hasDiscount && (
              <span className="absolute top-4 left-4 bg-[#B7B2FF] text-[#111] text-xs font-black px-3 py-1 rounded-full">
                {discountPercent}% OFF
              </span>
            )
          )}
        </div>

        {/* Content */}
        <div className="p-8 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-[#111] mb-2">
            {course.title}
          </h3>
          {course.short_description && (
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
              {course.short_description}
            </p>
          )}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-3 text-xs font-bold text-[#111]">
              {(course.lesson_count ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <PlayCircle size={16} /> {course.lesson_count}개 강의
                </span>
              )}
              {(course.total_duration ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {formatTotalDuration(course.total_duration!)}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end">
              {isComingSoon ? (
                <span className="text-[#111]/40 font-bold text-sm">공개 예정</span>
              ) : (
                <>
                  {hasDiscount && (
                    <span className="text-xs text-gray-400 line-through">
                      ₩{course.original_price!.toLocaleString()}
                    </span>
                  )}
                  {course.price > 0 ? (
                    <span className="text-[#B7B2FF] font-bold">{formattedPrice}</span>
                  ) : (
                    <span className="text-xl font-black text-[#111] px-1.5 bg-[#7FFF00]/70 rounded">
                      무료
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
