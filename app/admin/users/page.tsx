import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getUsers } from "./actions";
import { UsersTable } from "@/components/admin/users-table";
import { Skeleton } from "@/components/ui/skeleton";
import { isSuperAdmin } from "@/lib/admin/auth";

async function UsersTableContent({ page }: { page: number }) {
  noStore();
  const data = await getUsers(page, 10);
  const canDelete = await isSuperAdmin();
  return <UsersTable data={data} canDelete={canDelete} />;
}

function UsersTableSkeleton() {
  return <Skeleton className="h-96 w-full" />;
}

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);

  return (
    <Suspense fallback={<UsersTableSkeleton />}>
      <UsersTableContent page={page} />
    </Suspense>
  );
}
