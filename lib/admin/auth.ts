import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/admin";

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) return null;

  // role은 app_metadata에서만 읽는다 — user_metadata는 사용자가
  // updateUser()로 직접 수정할 수 있어 권한 판별에 쓰면 안 된다.
  const appMetadata = data.claims.app_metadata as { role?: UserRole };
  return appMetadata?.role || "user";
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) return null;
  return data.claims.sub as string;
}

export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "admin" || role === "super_admin";
}

export async function isSuperAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "super_admin";
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized: Admin access required");
  }
}

export async function requireSuperAdmin(): Promise<void> {
  if (!(await isSuperAdmin())) {
    throw new Error("Unauthorized: Super admin access required");
  }
}
