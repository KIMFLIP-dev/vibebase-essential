import { createAdminClient } from "@/lib/supabase/server";

// =====================================================
// 첫 관리자 자동 부여 (SQL 없이 env로 설정)
// - ADMIN_EMAIL 환경 변수와 같은 이메일의 계정이 가입/로그인하면
//   role이 없을 때 한 번만 super_admin을 부여한다.
// - env는 배포자만 제어하므로 안전하다. 이미 role이 있으면(강등 포함)
//   건드리지 않는다 — 운영 중 강등한 관리자가 재승격되는 것 방지.
// - 실패해도 가입/로그인 본 흐름은 막지 않는다.
// =====================================================

export async function ensureFirstAdmin(user: {
  id: string;
  email?: string | null;
}): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || !user.email) return false;
  if (user.email.toLowerCase() !== adminEmail) return false;

  try {
    const adminClient = createAdminClient();

    // JWT 클레임이 아닌 DB의 최신 app_metadata 기준으로 판단한다
    const { data: current } = await adminClient.auth.admin.getUserById(user.id);
    if (!current.user) return false;
    if (current.user.app_metadata?.role) return false; // 이미 역할 있음

    const { error } = await adminClient.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...current.user.app_metadata,
        role: "super_admin",
      },
    });

    if (error) {
      console.error("[bootstrap] 첫 관리자 부여 실패:", error);
      return false;
    }

    console.log(`[bootstrap] 첫 관리자(super_admin) 부여: ${user.email}`);
    return true;
  } catch (err) {
    console.error("[bootstrap] 첫 관리자 부여 오류:", err);
    return false;
  }
}
