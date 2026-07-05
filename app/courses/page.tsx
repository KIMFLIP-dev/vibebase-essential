import { Suspense } from "react";
import { NavbarNew } from "@/components/common_new/navbar";
import { FooterNew } from "@/components/landing/footer";
import { CourseListing } from "@/components/courses/course-listing";
import { InquiryButton } from "@/components/landing/inquiry-button";
import { getPublishedCourses } from "./actions";

async function CourseGrid() {
  const courses = await getPublishedCourses();
  return <CourseListing courses={courses} />;
}

function CourseGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-200" />
          <div className="p-8 space-y-3">
            <div className="h-5 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="flex justify-between pt-2">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9FB] font-sans">
      <NavbarNew />
      <main className="flex-1">
        {/* 헤더 */}
        <section className="pt-32 pb-10 md:pt-40 md:pb-12">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111] mb-3">
              <span className="inline-block px-5 py-1 bg-[#B7B2FF] text-white rounded-full italic mr-2">VibeBase</span>
              커리큘럼
            </h1>
            <p className="text-lg text-[#111] font-bold ml-[10px]">
              삽질 없이 순서대로. 끝엔 진짜 서비스 하나 남음.
              <br />
              유튜브에서 흘려보내기 아까운 강의들, 구독자님들만 보라고 여기 모셔둠.{" "}
              <span className="px-1.5 bg-[#7FFF00]/70 rounded font-bold">
                사이트 오픈준비중입니다. 아직 결제하지 말아줘~
              </span>
            </p>
          </div>
        </section>

        {/* 강좌 목록 */}
        <section className="max-w-7xl mx-auto px-6 pb-12">
          <Suspense fallback={<CourseGridSkeleton />}>
            <CourseGrid />
          </Suspense>
        </section>

        {/* 1:1 문의 */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-28 flex justify-center">
          <InquiryButton redirectTo="/courses" />
        </section>
      </main>
      <FooterNew />
    </div>
  );
}
