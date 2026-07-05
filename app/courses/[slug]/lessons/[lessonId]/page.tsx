import { redirect } from "next/navigation";
import { NavbarNew } from "@/components/common_new/navbar";
import { getLessonWithAccess } from "@/app/courses/actions";
import { LessonPageContent } from "@/components/courses/lesson-page-content";

interface LessonPageProps {
  params: Promise<{ slug: string; lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonId } = await params;
  const { lesson, course, hasAccess } = await getLessonWithAccess(lessonId);

  if (!lesson || !course) {
    redirect(`/courses/${slug}`);
  }

  if (!hasAccess) {
    redirect(`/courses/${slug}`);
  }

  // 이전/다음 레슨 찾기
  const allLessons: { id: string; title: string }[] = [];
  for (const chapter of course.chapters) {
    for (const l of chapter.lessons) {
      allLessons.push({ id: l.id, title: l.title });
    }
  }
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  // 구매 여부 (hasAccess가 true이므로 무료이거나 구매한 상태)
  // 유료 코스인데 접근 가능하면 구매한 것
  const purchased = course.price > 0 ? true : false;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavbarNew />
      <main className="flex-1 pt-32">
        <LessonPageContent
          lesson={lesson}
          course={course}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          purchased={purchased}
          slug={slug}
        />
      </main>
    </div>
  );
}
