// =====================================================
// 코스/강좌 관련 타입 정의
// =====================================================

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  price: number;
  original_price: number | null;
  currency: string;
  is_published: boolean;
  is_coming_soon: boolean;
  source_code_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  // 조인/집계 데이터
  chapters?: ChapterWithLessons[];
  lesson_count?: number;
  total_duration?: number;
  lesson_previews?: { title: string; is_free: boolean }[];
}

export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  vimeo_video_id: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  is_free: boolean;
  is_coming_soon: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterWithLessons extends Chapter {
  lessons: Lesson[];
}

export interface CourseWithChapters extends Course {
  chapters: ChapterWithLessons[];
}

export interface CoursePurchase {
  id: string;
  user_id: string | null;
  course_id: string;
  toss_order_id: string | null;
  toss_payment_key: string | null;
  status: "completed" | "refunded" | "failed";
  amount: number;
  currency: string;
  payment_method: string | null;
  is_refunded: boolean;
  refunded_amount: number;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
  // 조인 데이터
  course?: Course;
  user?: {
    email: string;
    user_metadata: Record<string, unknown>;
  };
}

export type CourseInput = Omit<
  Course,
  "id" | "created_at" | "updated_at" | "chapters" | "lesson_count" | "total_duration"
>;

export type ChapterInput = Omit<Chapter, "id" | "created_at" | "updated_at">;

export type LessonInput = Omit<Lesson, "id" | "created_at" | "updated_at">;
