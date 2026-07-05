import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserMenuNew } from "./user-menu";

export async function AuthButtonNew() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  // 구독 배지 - 현재 미운영
  // let subscription: { status: string; plan: { name: string } | null; isExpired: boolean } | null = null;
  // if (user) {
  //   const { data } = await supabase
  //     .from("subscriptions")
  //     .select("status, current_period_end, plan:pricing_plans!inner(name)")
  //     .eq("user_id", user.id)
  //     .in("status", ["active", "scheduled_cancel"])
  //     .order("created_at", { ascending: false })
  //     .limit(1)
  //     .single();
  //   if (data) {
  //     const isExpired = data.status === "scheduled_cancel" &&
  //       (!data.current_period_end || new Date(data.current_period_end) <= new Date());
  //     subscription = {
  //       status: data.status,
  //       plan: Array.isArray(data.plan) ? data.plan[0] : data.plan,
  //       isExpired,
  //     };
  //   }
  // }

  return user ? (
    <div className="flex items-center gap-2 text-sm">
      {/* 구독 배지 - 현재 미운영 */}
      {/* {subscription && !subscription.isExpired ? (
        <Link href="/mypage/subscription">
          <Badge variant="outline" className="cursor-pointer hover:opacity-80 border-[#111] text-[#111] bg-white">
            <Crown className="h-3 w-3 mr-1" />
            {subscription.plan?.name || "구독중"}
          </Badge>
        </Link>
      ) : (
        <Link href="/mypage/subscription">
          <Badge variant="outline" className="cursor-pointer hover:opacity-80 border-[#111] text-[#111] bg-white">
            무료
          </Badge>
        </Link>
      )} */}
      <UserMenuNew email={user.email || ""} isAdmin={isAdmin} />
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link
        href="/auth/login"
        className="bg-[#111] text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-[#333] transition-colors"
      >
        Log In
      </Link>
    </div>
  );
}
