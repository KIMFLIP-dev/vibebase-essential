import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { getPricingPlans } from "./actions";
import { PricingCards } from "@/components/admin/pricing-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isSuperAdmin } from "@/lib/admin/auth";
import { Plus, CreditCard, AlertTriangle } from "lucide-react";

function isCreemTestMode(): boolean {
  const apiUrl = process.env.CREEM_API_URL || "";
  return apiUrl.includes("test-api.creem.io");
}
async function PricingCardsContent() {
  noStore();
  const plans = await getPricingPlans();
  const canManage = await isSuperAdmin();
  return <PricingCards plans={plans} canManage={canManage} />;
}

function PricingCardsSkeleton() {
  return <Skeleton className="h-96 w-full" />;
}

export default async function AdminPricingPage() {
  const canManage = await isSuperAdmin();
  const isTestMode = isCreemTestMode();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground flex items-center whitespace-nowrap">
            <CreditCard className="h-5 w-5 mr-2 flex-shrink-0" /> 정기구독 가격 플랜 및 결제상품을 관리합니다.
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/admin/pricing/new">
              <Plus className="h-4 w-4 mr-2" />
              새 플랜 추가
            </Link>
          </Button>
        )}
      </div>

      {isTestMode && (
        <div className="flex justify-center">
          <Alert variant="destructive" className="w-fit bg-background border-red-600 text-red-600 [&>svg]:text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-600">
              현재 Creem 테스트 모드로 연결되어 있습니다. 실제 결제로는 처리되지 않습니다.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Suspense fallback={<PricingCardsSkeleton />}>
        <PricingCardsContent />
      </Suspense>
    </div>
  );
}
