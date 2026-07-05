import { PricingForm } from "@/components/admin/pricing-form";
import { requireSuperAdmin } from "@/lib/admin/auth";

export default async function NewPricingPlanPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">새 플랜 추가</h2>
        <p className="text-muted-foreground">
          새로운 정기구독 가격 플랜을 생성합니다.
        </p>
      </div>

      <PricingForm mode="create" />
    </div>
  );
}
