import { Suspense } from "react";
import Link from "next/link";
import { NavbarNew } from "@/components/common_new/navbar";
import { getUserCoursePurchases } from "@/app/courses/actions";
import { CourseCard } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

async function MyCoursesList() {
  const purchases = await getUserCoursePurchases();

  if (purchases.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50" />
        <p className="text-muted-foreground text-lg">
          구매한 강좌가 없습니다
        </p>
        <Button asChild variant="outline">
          <Link href="/courses">강좌 둘러보기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {purchases.map((purchase) =>
        purchase.course ? (
          <CourseCard key={purchase.id} course={purchase.course} />
        ) : null
      )}
    </div>
  );
}

function MyCoursesListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function MyCoursesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavbarNew />
      <main className="flex-1 pt-24 pb-20">
        <div className="container max-w-5xl mx-auto px-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
            내 강좌
          </h1>
          <Suspense fallback={<MyCoursesListSkeleton />}>
            <MyCoursesList />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
