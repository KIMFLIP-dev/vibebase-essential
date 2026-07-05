import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getActivePricingPlans } from "@/app/admin/pricing/actions";
import { getPendingCancelledSubscription, getCurrentSubscription } from "@/app/pricing/actions";
import { PricingSection } from "@/components/pricing/pricing-section";
import { Skeleton } from "@/components/ui/skeleton";

async function PricingContent() {
  noStore();
  const [plans, pendingCancellation, currentSubscription] = await Promise.all([
    getActivePricingPlans(),
    getPendingCancelledSubscription(),
    getCurrentSubscription(),
  ]);
  return (
    <PricingSection
      plans={plans}
      pendingCancellation={pendingCancellation}
      currentSubscription={currentSubscription}
    />
  );
}

function PricingSkeleton() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 mx-auto" />
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-96 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

import { NavbarNew } from "@/components/common_new/navbar";
import { FooterNew } from "@/components/landing/footer";

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <NavbarNew />
      <main className="flex-1" />
      <FooterNew />
    </div>
  );
}
