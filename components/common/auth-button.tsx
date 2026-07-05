import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserMenuNew } from "./user-menu";

export async function AuthButtonNew() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.app_metadata?.role;
  const isAdmin = role === "admin" || role === "super_admin";

  return user ? (
    <div className="flex items-center gap-2 text-sm">
      <UserMenuNew
        email={user.email || ""}
        isAdmin={isAdmin}
        avatarUrl={user.user_metadata?.avatar_url || null}
      />
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
