"use server";

import { createAdminClient } from "@/lib/supabase/server";
import {
  requireAdmin,
  isSuperAdmin,
  getCurrentUserId,
} from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";
import type { UserRole, AdminUser, UsersListResponse } from "@/lib/types/admin";

export async function getUsers(
  page: number = 1,
  perPage: number = 10
): Promise<UsersListResponse> {
  await requireAdmin();

  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    users: (data.users || []) as AdminUser[],
    total: data.total || 0,
    page,
    perPage,
  };
}

export async function getUser(userId: string): Promise<AdminUser | null> {
  await requireAdmin();

  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    throw new Error(error.message);
  }

  return data.user as AdminUser;
}

export async function updateUser(
  userId: string,
  updates: {
    email?: string;
    phone?: string;
    user_metadata?: Record<string, unknown>;
  }
): Promise<AdminUser> {
  await requireAdmin();

  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    updates
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);

  return data.user as AdminUser;
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<AdminUser> {
  const isSuperAdminUser = await isSuperAdmin();
  if (!isSuperAdminUser) {
    throw new Error("Unauthorized: Super admin access required for role changes");
  }

  const currentUserId = await getCurrentUserId();
  if (currentUserId === userId) {
    throw new Error("Cannot change your own role");
  }

  const supabase = createAdminClient();

  const { data: existingUser } = await supabase.auth.admin.getUserById(userId);
  if (!existingUser.user) {
    throw new Error("User not found");
  }

  // role은 app_metadata에 저장한다 — user_metadata는 사용자가 직접
  // 수정할 수 있어 권한 저장소로 쓰면 권한 상승 취약점이 된다.
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...existingUser.user.app_metadata,
      role,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);

  return data.user as AdminUser;
}

export async function deleteUser(userId: string): Promise<void> {
  const isSuperAdminUser = await isSuperAdmin();
  if (!isSuperAdminUser) {
    throw new Error("Unauthorized: Super admin access required for user deletion");
  }

  const currentUserId = await getCurrentUserId();
  if (currentUserId === userId) {
    throw new Error("Cannot delete your own account");
  }

  const supabase = createAdminClient();

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

export async function getDashboardStats() {
  await requireAdmin();

  const supabase = createAdminClient();

  const { data } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const users = data?.users || [];
  const total = users.length;
  const verified = users.filter((u) => u.email_confirmed_at).length;
  const unverified = total - verified;
  const recentLogins = users.filter((u) => {
    if (!u.last_sign_in_at) return false;
    const lastLogin = new Date(u.last_sign_in_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return lastLogin > weekAgo;
  }).length;

  return { total, verified, unverified, recentLogins };
}
