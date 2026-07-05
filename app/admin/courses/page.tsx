import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { getAdminCourses } from "./actions";
import { CoursesTable } from "@/components/admin/courses-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, Clock, Plus, Eye } from "lucide-react";
import { formatTotalDuration } from "@/lib/vimeo/client";

async function CoursesContent() {
  noStore();
  const courses = await getAdminCourses();

  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.is_published).length;
  const totalLessons = courses.reduce((sum, c) => sum + (c.lesson_count || 0), 0);
  const totalDuration = courses.reduce((sum, c) => sum + (c.total_duration || 0), 0);

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 코스</p>
                <p className="text-2xl font-bold">{totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">공개 코스</p>
                <p className="text-2xl font-bold">{publishedCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 레슨</p>
                <p className="text-2xl font-bold">{totalLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 시간</p>
                <p className="text-2xl font-bold">{formatTotalDuration(totalDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 테이블 */}
      <CoursesTable courses={courses} />
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default async function AdminCoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground flex items-center whitespace-nowrap">
            <GraduationCap className="h-5 w-5 mr-2 flex-shrink-0" /> 동영상 강좌를 관리합니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            새 코스 만들기
          </Link>
        </Button>
      </div>

      <Suspense fallback={<CoursesSkeleton />}>
        <CoursesContent />
      </Suspense>
    </div>
  );
}
