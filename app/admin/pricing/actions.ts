"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireSuperAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";
import { getCreemClient, isCreemConfigured } from "@/lib/creem/client";
import type { PricingPlan, PricingPlanInput } from "@/lib/types/admin";

// Creem 상품 생성/연결 헬퍼
// 참고: DB는 달러 단위, Creem API는 센트 단위
// 기존 상품이 있으면 연결하고, 없으면 새로 생성 (allowCreate가 true일 때만)
async function syncToCreem(plan: {
  name: string;
  description?: string | null;
  price: number; // 달러 단위 (예: 9.99)
  billing_type: "recurring" | "onetime";
  billing_period?: "every-month" | "every-year"; // recurring일 때만 사용
}, allowCreate: boolean = true): Promise<string | null> {
  if (!isCreemConfigured()) {
    console.log("Creem API가 설정되지 않아 동기화를 건너뜁니다.");
    return null;
  }

  try {
    const creem = getCreemClient();
    const priceInCents = Math.round(plan.price * 100);

    if (plan.billing_type === "onetime") {
      // 1회성 결제 상품
      const productName = plan.name;

      // 기존 상품 검색
      const existingId = await creem.findMatchingProduct({
        name: productName,
        price: priceInCents,
        billing_type: "onetime",
      });

      if (existingId) {
        console.log(`기존 상품 연결: ${productName} (${existingId})`);
        return existingId;
      }

      // 새 상품 생성 (allowCreate가 true일 때만)
      if (!allowCreate) {
        console.log(`새 상품 생성 필요하지만 allowCreate=false: ${productName}`);
        return null;
      }

      const product = await creem.createProduct({
        name: productName,
        description: plan.description || plan.name,
        price: priceInCents,
        currency: "USD",
        billing_type: "onetime",
        tax_mode: "inclusive",
        tax_category: "saas",
      });
      console.log(`새 상품 생성: ${productName} (${product.id})`);
      return product.id;
    } else {
      // 구독 상품
      const periodLabel = plan.billing_period === "every-year" ? " (연간)" : " (월간)";
      const productName = plan.name + periodLabel;

      // 기존 상품 검색
      const existingId = await creem.findMatchingProduct({
        name: productName,
        price: priceInCents,
        billing_type: "recurring",
        billing_period: plan.billing_period,
      });

      if (existingId) {
        console.log(`기존 상품 연결: ${productName} (${existingId})`);
        return existingId;
      }

      // 새 상품 생성 (allowCreate가 true일 때만)
      if (!allowCreate) {
        console.log(`새 상품 생성 필요하지만 allowCreate=false: ${productName}`);
        return null;
      }

      const product = await creem.createProduct({
        name: productName,
        description: plan.description || plan.name,
        price: priceInCents,
        currency: "USD",
        billing_type: "recurring",
        billing_period: plan.billing_period,
        tax_mode: "inclusive",
        tax_category: "saas",
      });
      console.log(`새 상품 생성: ${productName} (${product.id})`);
      return product.id;
    }
  } catch (error) {
    console.error("Creem 동기화 실패:", error);
    return null;
  }
}

// 공개용: 활성화된 구독형 플랜만 조회 (인증 불필요)
export async function getActivePricingPlans(): Promise<PricingPlan[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("is_active", true)
    .eq("billing_type", "recurring")
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as PricingPlan[];
}

// 관리자용: 모든 플랜 조회
export async function getPricingPlans(): Promise<PricingPlan[]> {
  await requireAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pricing_plans")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as PricingPlan[];
}

// 차트용: 구독 플랜만 조회 (최대 3개)
export async function getSubscriptionPlansForChart(): Promise<Pick<PricingPlan, "id" | "name">[]> {
  await requireAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pricing_plans")
    .select("id, name")
    .eq("billing_type", "recurring")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(3);

  if (error) {
    console.error("구독 플랜 조회 실패:", error.message);
    return [];
  }

  return data || [];
}

export async function getPricingPlan(id: string): Promise<PricingPlan | null> {
  await requireAdmin();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(error.message);
  }

  return data as PricingPlan;
}

export async function createPricingPlan(
  input: PricingPlanInput,
  autoSyncCreem: boolean = false
): Promise<PricingPlan> {
  await requireSuperAdmin();

  if (!input.name || input.name.trim().length === 0) {
    throw new Error("플랜명을 입력해주세요.");
  }

  if (input.price_monthly < 0) {
    throw new Error("월간 가격은 0 이상이어야 합니다.");
  }

  if (input.price_yearly !== null && input.price_yearly < 0) {
    throw new Error("연간 가격은 0 이상이어야 합니다.");
  }

  // Creem 상품 생성 (autoSyncCreem이 true일 때만)
  let creemProductId: string | null = null;
  let creemProductIdYearly: string | null = null;

  if (autoSyncCreem) {
    if (input.billing_type === "onetime") {
      // 1회성 결제: 단일 상품만 생성
      creemProductId = await syncToCreem({
        name: input.name.trim(),
        description: input.description,
        price: input.price_monthly,
        billing_type: "onetime",
      });
    } else {
      // 구독: 월간 상품 생성
      creemProductId = await syncToCreem({
        name: input.name.trim(),
        description: input.description,
        price: input.price_monthly,
        billing_type: "recurring",
        billing_period: "every-month",
      });

      // 연간 상품 생성 (연간 가격이 있는 경우)
      if (input.price_yearly) {
        creemProductIdYearly = await syncToCreem({
          name: input.name.trim(),
          description: input.description,
          price: input.price_yearly,
          billing_type: "recurring",
          billing_period: "every-year",
        });
      }
    }
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pricing_plans")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      billing_type: input.billing_type || "recurring",
      price_monthly: input.price_monthly,
      price_yearly: input.price_yearly,
      currency: input.currency || "USD",
      features: input.features || [],
      display_order: input.display_order || 0,
      is_active: input.is_active ?? true,
      is_popular: input.is_popular ?? false,
      creem_product_id: creemProductId,
      creem_product_id_yearly: creemProductIdYearly,
      download_url: input.billing_type === "onetime" ? (input.download_url || null) : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/pricing");

  return data as PricingPlan;
}

export async function updatePricingPlan(
  id: string,
  input: Partial<PricingPlanInput>
): Promise<PricingPlan> {
  await requireSuperAdmin();

  if (input.name !== undefined && input.name.trim().length === 0) {
    throw new Error("플랜명을 입력해주세요.");
  }

  if (input.price_monthly !== undefined && input.price_monthly < 0) {
    throw new Error("월간 가격은 0 이상이어야 합니다.");
  }

  if (input.price_yearly !== undefined && input.price_yearly !== null && input.price_yearly < 0) {
    throw new Error("연간 가격은 0 이상이어야 합니다.");
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.billing_type !== undefined) updateData.billing_type = input.billing_type;
  if (input.price_monthly !== undefined) updateData.price_monthly = input.price_monthly;
  if (input.price_yearly !== undefined) updateData.price_yearly = input.price_yearly;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.features !== undefined) updateData.features = input.features;
  if (input.display_order !== undefined) updateData.display_order = input.display_order;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.is_popular !== undefined) updateData.is_popular = input.is_popular;
  if (input.download_url !== undefined) {
    updateData.download_url = input.billing_type === "onetime" ? (input.download_url || null) : null;
  }

  const { data, error } = await supabase
    .from("pricing_plans")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/pricing");
  revalidatePath(`/admin/pricing/${id}`);
  revalidatePath("/pricing");

  return data as PricingPlan;
}

export async function deletePricingPlan(id: string): Promise<void> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from("pricing_plans")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/pricing");
}

export async function togglePlanActive(id: string): Promise<PricingPlan> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("pricing_plans")
    .select("is_active")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const { data, error } = await supabase
    .from("pricing_plans")
    .update({
      is_active: !current.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/pricing");

  return data as PricingPlan;
}

// Creem 동기화 전 상태 확인 (생성 필요 여부 반환)
export async function checkCreemSyncStatus(id: string): Promise<{
  needsMonthlyCreate: boolean;
  needsYearlyCreate: boolean;
  monthlyExistingId: string | null;
  yearlyExistingId: string | null;
}> {
  await requireSuperAdmin();

  if (!isCreemConfigured()) {
    throw new Error("Creem API가 설정되지 않았습니다.");
  }

  const supabase = await createClient();

  const { data: plan, error: fetchError } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const creem = getCreemClient();
  let needsMonthlyCreate = false;
  let needsYearlyCreate = false;
  let monthlyExistingId: string | null = null;
  let yearlyExistingId: string | null = null;

  if (!plan.creem_product_id) {
    if (plan.billing_type === "onetime") {
      // 1회성 상품 검색
      monthlyExistingId = await creem.findMatchingProduct({
        name: plan.name,
        price: Math.round(plan.price_monthly * 100),
        billing_type: "onetime",
      });
      needsMonthlyCreate = !monthlyExistingId;
    } else {
      // 월간 구독 상품 검색
      monthlyExistingId = await creem.findMatchingProduct({
        name: plan.name + " (월간)",
        price: Math.round(plan.price_monthly * 100),
        billing_type: "recurring",
        billing_period: "every-month",
      });
      needsMonthlyCreate = !monthlyExistingId;
    }
  }

  if (plan.billing_type === "recurring" && plan.price_yearly && !plan.creem_product_id_yearly) {
    // 연간 구독 상품 검색
    yearlyExistingId = await creem.findMatchingProduct({
      name: plan.name + " (연간)",
      price: Math.round(plan.price_yearly * 100),
      billing_type: "recurring",
      billing_period: "every-year",
    });
    needsYearlyCreate = !yearlyExistingId;
  }

  return {
    needsMonthlyCreate,
    needsYearlyCreate,
    monthlyExistingId,
    yearlyExistingId,
  };
}

// Creem 동기화 실행 (allowCreate: false면 기존 상품 연결만)
export async function syncPlanToCreem(id: string, allowCreate: boolean = true): Promise<PricingPlan> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { data: plan, error: fetchError } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  let creemProductId = plan.creem_product_id;
  let creemProductIdYearly = plan.creem_product_id_yearly;

  if (plan.billing_type === "onetime") {
    // 1회성 결제: 단일 상품만 동기화
    if (!creemProductId) {
      creemProductId = await syncToCreem({
        name: plan.name,
        description: plan.description,
        price: plan.price_monthly,
        billing_type: "onetime",
      }, allowCreate);
    }
  } else {
    // 구독: 월간 동기화 (아직 안된 경우)
    if (!creemProductId) {
      creemProductId = await syncToCreem({
        name: plan.name,
        description: plan.description,
        price: plan.price_monthly,
        billing_type: "recurring",
        billing_period: "every-month",
      }, allowCreate);
    }

    // 연간 동기화 (연간 가격이 있고 아직 안된 경우)
    if (plan.price_yearly && !creemProductIdYearly) {
      creemProductIdYearly = await syncToCreem({
        name: plan.name,
        description: plan.description,
        price: plan.price_yearly,
        billing_type: "recurring",
        billing_period: "every-year",
      }, allowCreate);
    }
  }

  if (!creemProductId && !creemProductIdYearly) {
    throw new Error("Creem 동기화에 실패했습니다. API 키를 확인해주세요.");
  }

  const { data, error } = await supabase
    .from("pricing_plans")
    .update({
      creem_product_id: creemProductId,
      creem_product_id_yearly: creemProductIdYearly,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/pricing");

  return data as PricingPlan;
}

// Creem 연동 상태 확인 및 유효하지 않은/Archived ID 초기화
export async function verifyCreemSync(id: string): Promise<{
  monthly: boolean;
  yearly: boolean;
  cleaned: boolean;
  monthlyArchived: boolean;
  yearlyArchived: boolean;
}> {
  await requireSuperAdmin();

  if (!isCreemConfigured()) {
    throw new Error("Creem API가 설정되지 않았습니다.");
  }

  const supabase = await createClient();

  const { data: plan, error: fetchError } = await supabase
    .from("pricing_plans")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const creem = getCreemClient();
  let monthlyValid = false;
  let yearlyValid = false;
  let monthlyArchived = false;
  let yearlyArchived = false;
  let needsUpdate = false;

  // 월간 상품 확인 (active 상태만 유효)
  if (plan.creem_product_id) {
    const status = await creem.checkProductStatus(plan.creem_product_id);
    if (status === "active") {
      monthlyValid = true;
    } else {
      needsUpdate = true;
      if (status === "archived") {
        monthlyArchived = true;
      }
    }
  }

  // 연간 상품 확인 (active 상태만 유효)
  if (plan.creem_product_id_yearly) {
    const status = await creem.checkProductStatus(plan.creem_product_id_yearly);
    if (status === "active") {
      yearlyValid = true;
    } else {
      needsUpdate = true;
      if (status === "archived") {
        yearlyArchived = true;
      }
    }
  }

  // 유효하지 않은 ID 초기화 (not_found 또는 archived)
  if (needsUpdate) {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (!monthlyValid && plan.creem_product_id) {
      updateData.creem_product_id = null;
    }
    if (!yearlyValid && plan.creem_product_id_yearly) {
      updateData.creem_product_id_yearly = null;
    }

    await supabase
      .from("pricing_plans")
      .update(updateData)
      .eq("id", id);

    revalidatePath("/admin/pricing");
  }

  return {
    monthly: monthlyValid,
    yearly: yearlyValid,
    cleaned: needsUpdate,
    monthlyArchived,
    yearlyArchived,
  };
}

// Creem 연동 초기화 (ID를 null로 설정)
export async function resetCreemSync(id: string): Promise<void> {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { error } = await supabase
    .from("pricing_plans")
    .update({
      creem_product_id: null,
      creem_product_id_yearly: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/pricing");
}
