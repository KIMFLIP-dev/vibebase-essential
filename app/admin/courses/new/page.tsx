import { CourseForm } from "@/components/admin/course-form";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewCoursePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">새 코스 만들기</h2>
        <p className="text-muted-foreground">
          새로운 동영상 강좌를 생성합니다.
        </p>
      </div>

      <CourseForm mode="create" />
    </div>
  );
}
