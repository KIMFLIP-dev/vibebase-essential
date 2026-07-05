export type UserRole = "user" | "admin" | "super_admin";

export interface AdminUser {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
  // role은 app_metadata에만 둔다 (user_metadata는 사용자 수정 가능)
  app_metadata: {
    role?: UserRole;
    provider?: string;
    providers?: string[];
    [key: string]: unknown;
  };
}

export interface UsersListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  perPage: number;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}
