"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cancelPayment } from "@/lib/portone/client";
import { PortOneApiError } from "@/lib/portone/client";
import { isSuperAdmin } from "@/lib/admin/auth";

export interface CoursePurchaseListItem {
  id: string;
  user_id: string | null;
  course_id: string;
  toss_order_id: string | null;
  toss_payment_key: string | null;
  status: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  is_refunded: boolean;
  refunded_amount: number;
  refunded_at: string | null;
  created_at: string;
  course?: { id: string; title: string; slug: string };
  user?: { email: string; user_metadata: Record<string, unknown> };
}

export async function getCoursePurchases(
  page: number = 1,
  perPage: number = 10,
  search?: string
): Promise<{ purchases: CoursePurchaseListItem[]; total: number; page: number; perPage: number }> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 이메일 검색인 경우 먼저 user_id 찾기
  let searchUserIds: string[] | null = null;
  if (search && search.includes("@")) {
    try {
      const { data: usersData } = await adminClient.auth.admin.listUsers();
      if (usersData?.users) {
        searchUserIds = usersData.users
          .filter((user) => user.email?.toLowerCase().includes(search.toLowerCase()))
          .map((user) => user.id);
      }
    } catch (e) {
      console.error("사용자 검색 오류:", e);
    }
  }

  let query = supabase
    .from("course_purchases")
    .select(
      `
      *,
      course:courses(id, title, slug)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  // 검색 필터 적용
  if (search) {
    if (search.includes("@") && searchUserIds !== null) {
      if (searchUserIds.length > 0) {
        query = query.in("user_id", searchUserIds);
      } else {
        return { purchases: [], total: 0, page, perPage };
      }
    } else {
      query = query.ilike("toss_order_id", `%${search}%`);
    }
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("코스 구매 조회 오류:", error);
    throw new Error("구매 목록을 불러오는데 실패했습니다.");
  }

  // 사용자 정보 별도 조회
  const userIds = [...new Set((data || []).map((p) => p.user_id).filter(Boolean))];
  const userMap: Record<string, { email: string; user_metadata: Record<string, unknown> }> = {};

  if (userIds.length > 0) {
    try {
      const { data: usersData } = await adminClient.auth.admin.listUsers();
      if (usersData?.users) {
        for (const user of usersData.users) {
          if (userIds.includes(user.id)) {
            userMap[user.id] = {
              email: user.email || "",
              user_metadata: user.user_metadata || {},
            };
          }
        }
      }
    } catch (e) {
      console.error("사용자 정보 조회 오류:", e);
    }
  }

  const purchases = (data || []).map((item) => ({
    ...item,
    user: item.user_id ? userMap[item.user_id] : undefined,
  }));

  return {
    purchases,
    total: count || 0,
    page,
    perPage,
  };
}

export async function getCoursePurchaseStats(): Promise<{
  total: number;
  completed: number;
  refunded: number;
}> {
  const supabase = await createClient();

  const { count: total } = await supabase
    .from("course_purchases")
    .select("*", { count: "exact", head: true });

  const { count: completed } = await supabase
    .from("course_purchases")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const { count: refunded } = await supabase
    .from("course_purchases")
    .select("*", { count: "exact", head: true })
    .eq("is_refunded", true);

  return {
    total: total || 0,
    completed: completed || 0,
    refunded: refunded || 0,
  };
}

export async function cancelCoursePurchase(
  purchaseId: string,
  cancelReason: string = "관리자 취소"
): Promise<{ success: boolean; error?: string }> {
  const canManage = await isSuperAdmin();
  if (!canManage) {
    return { success: false, error: "권한이 없습니다." };
  }

  const supabase = await createClient();

  const { data: purchase, error: fetchError } = await supabase
    .from("course_purchases")
    .select("id, toss_payment_key, status, amount")
    .eq("id", purchaseId)
    .single();

  if (fetchError || !purchase) {
    return { success: false, error: "구매를 찾을 수 없습니다." };
  }

  if (!purchase.toss_payment_key) {
    return { success: false, error: "결제 키가 없습니다." };
  }

  if (purchase.status === "refunded") {
    return { success: false, error: "이미 환불된 건입니다." };
  }

  try {
    await cancelPayment(purchase.toss_payment_key, { cancelReason });

    const adminClient = createAdminClient();
    await adminClient
      .from("course_purchases")
      .update({
        status: "refunded",
        is_refunded: true,
        refunded_amount: purchase.amount,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", purchaseId);

    return { success: true };
  } catch (err) {
    if (err instanceof PortOneApiError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "결제 취소에 실패했습니다." };
  }
}
