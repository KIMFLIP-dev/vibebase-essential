import { getPublishedCourses } from "@/app/courses/actions";
import { CurriculumClient } from "./curriculum-client";

export async function CurriculumNew() {
  const courses = await getPublishedCourses();

  const mapped = courses.map((course) => ({
    slug: course.slug,
    title: course.title,
    description: course.short_description || "",
    lectures: course.lesson_count ?? 0,
    price: course.price > 0 ? `₩${course.price.toLocaleString()}` : "무료",
    image: course.thumbnail_url || "",
    isComingSoon: course.is_coming_soon,
  }));

  return <CurriculumClient courses={mapped} />;
}
