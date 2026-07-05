import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function SidebarSkeleton() {
  return (
    <aside className="w-64 flex flex-col">
      <div className="h-14 flex items-center px-4 border-b">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="px-3 py-4 space-y-4">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </aside>
  );
}

function HeaderSkeleton() {
  return <div className="h-14 border-b bg-background" />;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen p-4 pl-0 bg-muted/80">
      <div className="flex min-h-[calc(100vh-2rem)] overflow-hidden">
        <Suspense fallback={<SidebarSkeleton />}>
          <AdminSidebar />
        </Suspense>
        <div className="flex-1 flex flex-col rounded-lg border bg-background shadow-sm">
          <Suspense fallback={<HeaderSkeleton />}>
            <AdminHeader />
          </Suspense>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
