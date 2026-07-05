import { notFound } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";
import { CourseChaptersEditor } from "@/components/admin/course-chapters-editor";
import { getAdminCourse } from "../actions";
import { requireAdmin } from "@/lib/admin/auth";
import { Separator } from "@/components/ui/separator";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCoursePage({ params }: Props) {
  await requireAdmin();

  const { id } = await params;
  const course = await getAdminCourse(id);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">코스 수정</h2>
        <p className="text-muted-foreground">
          {course.title} 코스의 정보를 수정합니다.
        </p>
      </div>

      <CourseForm course={course} mode="edit" />

      <Separator />

      <div>
        <h2 className="text-2xl font-bold tracking-tight">챕터 & 레슨 관리</h2>
        <p className="text-muted-foreground">
          코스의 챕터와 레슨을 추가/수정/삭제할 수 있습니다.
        </p>
      </div>

      <CourseChaptersEditor courseId={course.id} chapters={course.chapters} />
    </div>
  );
}
