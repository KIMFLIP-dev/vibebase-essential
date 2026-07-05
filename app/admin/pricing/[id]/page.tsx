import { notFound } from "next/navigation";
import { PricingForm } from "@/components/admin/pricing-form";
import { getPricingPlan } from "../actions";
import { requireSuperAdmin } from "@/lib/admin/auth";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPricingPlanPage({ params }: Props) {
  await requireSuperAdmin();

  const { id } = await params;
  const plan = await getPricingPlan(id);

  if (!plan) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">플랜 수정</h2>
        <p className="text-muted-foreground">
          {plan.name} 플랜의 정보를 수정합니다.
        </p>
      </div>

      <PricingForm plan={plan} mode="edit" />
    </div>
  );
}
