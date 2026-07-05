import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { getAdminPosts } from "./actions";
import { PostsTable } from "@/components/admin/posts-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper, Eye, BarChart3, FileEdit, Plus } from "lucide-react";

async function PostsContent() {
  noStore();
  const items = await getAdminPosts();

  const total = items.length;
  const published = items.filter((i) => i.status === "published").length;
  const drafts = items.filter((i) => i.status === "draft").length;
  const totalViews = items.reduce((sum, i) => sum + (i.view_count ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Newspaper className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 글</p>
                <p className="text-2xl font-bold">{total}</p>
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
                <p className="text-sm text-muted-foreground">발행</p>
                <p className="text-2xl font-bold">{published}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <FileEdit className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">임시저장</p>
                <p className="text-2xl font-bold">{drafts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 조회수</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PostsTable items={items} />
    </div>
  );
}

function PostsSkeleton() {
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

export default async function AdminPostsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground flex items-center whitespace-nowrap">
            <Newspaper className="h-5 w-5 mr-2 flex-shrink-0" /> /blog 페이지의 블로그 글을 관리합니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />새 글 작성
          </Link>
        </Button>
      </div>

      <Suspense fallback={<PostsSkeleton />}>
        <PostsContent />
      </Suspense>
    </div>
  );
}
