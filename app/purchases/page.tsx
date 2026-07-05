import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { getActiveOnetimePlans } from "@/app/purchases/actions";
import { PurchasesSection } from "@/components/purchases/purchases-section";
import { Skeleton } from "@/components/ui/skeleton";
import { NavbarNew } from "@/components/common_new/navbar";
import { FooterNew } from "@/components/landing/footer";

async function PurchasesContent() {
  noStore();
  const plans = await getActiveOnetimePlans();
  return <PurchasesSection plans={plans} />;
}

function PurchasesSkeleton() {
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

export default function PurchasesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9FB] font-sans">
      <NavbarNew />
      <main className="flex-1">
        <Suspense fallback={<PurchasesSkeleton />}>
          <PurchasesContent />
        </Suspense>
      </main>
      <FooterNew />
    </div>
  );
}
