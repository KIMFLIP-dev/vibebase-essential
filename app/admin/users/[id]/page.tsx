import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { getUser } from "../actions";
import { UserDetailForm } from "@/components/admin/user-detail-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isSuperAdmin } from "@/lib/admin/auth";

interface Props {
  params: Promise<{ id: string }>;
}

async function UserDetailContent({ id }: { id: string }) {
  noStore();
  const user = await getUser(id);
  const canChangeRole = await isSuperAdmin();

  if (!user) {
    notFound();
  }

  return <UserDetailForm user={user} canChangeRole={canChangeRole} />;
}

function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold">회원 상세</h1>

      <Suspense fallback={<UserDetailSkeleton />}>
        <UserDetailContent id={id} />
      </Suspense>
    </div>
  );
}
