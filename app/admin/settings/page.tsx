import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { getSiteName } from "./actions";

async function SettingsContent() {
  noStore();
  const siteName = await getSiteName();

  return <SiteSettingsForm initialSiteName={siteName} />;
}

function SettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-10 w-16" />
      </CardContent>
    </Card>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
