import { notFound } from "next/navigation";
import { NavbarNew } from "@/components/common_new/navbar";
import { CourseDetail } from "@/components/courses/course-detail";
import { getCourseBySlug, hasUserPurchasedCourse } from "../actions";
import { createClient } from "@/lib/supabase/server";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(decodeURIComponent(slug));

  if (!course) {
    notFound();
  }

  // 유저 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const purchased = user ? await hasUserPurchasedCourse(course.id) : false;

  // source_code_url 경로를 클라이언트에 노출하지 않음
  const { source_code_url, ...safeCourseParts } = course;
  const safeCourse = { ...safeCourseParts, source_code_url: null };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9FB] font-sans">
      <NavbarNew />
      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <CourseDetail
            course={safeCourse}
            purchased={purchased}
            isLoggedIn={!!user}
            hasSourceCode={!!source_code_url}
          />
        </div>
      </main>
    </div>
  );
}
