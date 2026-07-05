import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/admin";

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) return null;

  const userMetadata = data.claims.user_metadata as { role?: UserRole };
  return userMetadata?.role || "user";
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
